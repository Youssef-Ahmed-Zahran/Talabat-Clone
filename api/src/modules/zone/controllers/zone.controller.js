import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { cache } from "../../../lib/cache.js";

// ═══════════════════════════════════════════════════════════════
// UTILITY — Detect which zone a lat/lng falls inside
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the first active zone whose PostGIS polygon contains the given point.
 * Returns null if the point is outside all zones.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{id:string, name:string}|null>}
 */
export const detectZone = async (lat, lng) => {
    // Round to 3 decimal places (~111m grid) — users within the same block hit the same cache entry
    const latKey = Number(lat).toFixed(3);
    const lngKey = Number(lng).toFixed(3);
    const cacheKey = `zones:detect:${latKey}_${lngKey}`;

    const cached = await cache.get(cacheKey);
    if (cached !== null) return cached; // cached value may be the zone object OR null (outside zones)

    const rows = await prisma.$queryRaw`
        SELECT id, name, color
        FROM public.zones
        WHERE "isActive" = true
          AND ST_Within(
            ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326),
            boundary
          )
        LIMIT 1
    `;
    const zone = rows[0] ?? null;

    // Cache for 5 minutes — zones don't change during a user session
    // We store null explicitly so we don't re-query for users outside all zones
    await cache.set(cacheKey, zone, 300);
    return zone;
};

// ═══════════════════════════════════════════════════════════════
// CREATE ZONE
// POST /api/zones
// Admin only — body: { name, cityId, description?, color?, geojson }
// geojson: a GeoJSON Polygon geometry object { type: "Polygon", coordinates: [...] }
// ═══════════════════════════════════════════════════════════════

export const createZone = async (req, res, next) => {
    try {
        const { name, cityId, description, color, geojson } = req.body;

        if (!name || !cityId || !geojson) {
            throw new ApiError(400, "name, cityId, and geojson are required.");
        }

        const city = await prisma.city.findUnique({ where: { id: cityId } });
        if (!city) throw new ApiError(404, "City not found.");

        // 1. Create the zone row (without boundary — PostGIS column)
        const zone = await prisma.zone.create({
            data: {
                name,
                cityId,
                description: description || null,
                color: color || null,
            },
        });

        // 2. Set the PostGIS boundary geometry from GeoJSON in a raw UPDATE
        const geojsonStr = JSON.stringify(geojson);
        await prisma.$executeRaw`
            UPDATE public.zones
            SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}::text), 4326)
            WHERE id = ${zone.id}
        `;

        res.status(201).json(new ApiResponse(201, zone, "Zone created."));

        // New zone affects delivery coverage — invalidate nearby stores and zone list caches
        await cache.delPattern("zones:*");
        await cache.delPattern("stores:*");
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET ALL ZONES (with optional city filter + GeoJSON boundary)
// GET /api/zones?cityId=&includeGeometry=true
// ═══════════════════════════════════════════════════════════════

export const getAllZones = async (req, res, next) => {
    try {
        const { cityId, includeGeometry = "false", page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const cacheKey = includeGeometry === "true"
            ? null  // never cache geometry payloads — too large
            : `zones:all:city_${cityId || "any"}:p_${page}:l_${limit}`;

        if (cacheKey) {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json(new ApiResponse(200, cached, "Zones fetched (cached)."));
        }

        const where = {};
        if (cityId) where.cityId = cityId;

        const [zones, total] = await Promise.all([
            prisma.zone.findMany({
                where,
                skip,
                take,
                include: {
                    city: { select: { id: true, name: true } },
                    _count: { select: { storeZones: true, driverZones: true } },
                },
                orderBy: { createdAt: "asc" },
            }),
            prisma.zone.count({ where }),
        ]);

        let result = zones;
        if (includeGeometry === "true") {
            const geoRows = cityId
                ? await prisma.$queryRaw`SELECT id, ST_AsGeoJSON(boundary)::text AS geojson FROM public.zones WHERE "cityId" = ${cityId}`
                : await prisma.$queryRaw`SELECT id, ST_AsGeoJSON(boundary)::text AS geojson FROM public.zones`;
            const geoMap = Object.fromEntries(geoRows.map((r) => [r.id, r.geojson ? JSON.parse(r.geojson) : null]));
            result = zones.map((z) => ({ ...z, boundary: geoMap[z.id] ?? null }));
        }

        const responseData = {
            zones: result,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        };

        if (cacheKey) await cache.set(cacheKey, responseData, 300); // 5 min

        res.json(new ApiResponse(200, responseData, "Zones fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET ZONE BY ID (with GeoJSON boundary)
// GET /api/zones/:id
// ═══════════════════════════════════════════════════════════════

export const getZoneById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Cache zone detail for 5 minutes (geometry included)
        const cacheKey = `zones:detail:${id}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(new ApiResponse(200, cached, "Zone fetched (cached)."));

        const zone = await prisma.zone.findUnique({
            where: { id },
            include: {
                city: { select: { id: true, name: true } },
                _count: { select: { storeZones: true, driverZones: true } },
                storeZones: {
                    include: {
                        store: { select: { id: true, name: true, logoUrl: true, isActive: true } },
                    },
                },
                driverZones: {
                    include: {
                        driver: {
                            select: {
                                id: true,
                                phone: true,
                                isOnline: true,
                                status: true,
                                application: {
                                    select: { firstName: true, familyName: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!zone) {
            console.error(`[getZoneById] Zone not found: ${id}`);
            throw new ApiError(404, "Zone not found.");
        }

        console.log(`[getZoneById] Fetched zone: ${zone.name}, Stores: ${zone.storeZones?.length}`);

        const geoRows = await prisma.$queryRaw`
            SELECT ST_AsGeoJSON(boundary)::text AS geojson FROM public.zones WHERE id = ${id}
        `;
        const boundary = geoRows[0]?.geojson ? JSON.parse(geoRows[0].geojson) : null;

        const responseData = {
            ...zone,
            boundary,
            storeZones: zone.storeZones || [],
            driverZones: zone.driverZones || [],
            _count: zone._count
        };

        await cache.set(cacheKey, responseData, 300);

        res.json(new ApiResponse(200, responseData, "Zone fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DETECT ZONE FROM COORDINATES
// GET /api/zones/detect?lat=&lng=
// Public — used by mobile when user drops a pin
// ═══════════════════════════════════════════════════════════════

export const detectZoneFromCoords = async (req, res, next) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) throw new ApiError(400, "lat and lng are required.");

        const zone = await detectZone(Number(lat), Number(lng));

        if (!zone) {
            return res.status(404).json(
                new ApiResponse(404, null, "No delivery zone covers your location.")
            );
        }

        res.json(new ApiResponse(200, zone, "Zone detected."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE ZONE
// PUT /api/zones/:id
// Admin only
// ═══════════════════════════════════════════════════════════════

export const updateZone = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, color, isActive, geojson } = req.body;

        const existing = await prisma.zone.findUnique({ where: { id } });
        if (!existing) throw new ApiError(404, "Zone not found.");

        const zone = await prisma.zone.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(color !== undefined && { color }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        // If a new polygon is provided, update the PostGIS boundary
        if (geojson) {
            const geojsonStr = JSON.stringify(geojson);
            await prisma.$executeRaw`
                UPDATE public.zones
                SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}::text), 4326)
                WHERE id = ${id}
            `;
        }

        res.json(new ApiResponse(200, zone, "Zone updated."));

        // Invalidate all zone and nearby store caches — updated polygon changes delivery coverage
        await cache.delPattern("zones:*");
        await cache.delPattern("stores:*");
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DELETE ZONE
// DELETE /api/zones/:id
// Admin only
// ═══════════════════════════════════════════════════════════════

export const deleteZone = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await prisma.zone.findUnique({ where: { id } });
        if (!existing) throw new ApiError(404, "Zone not found.");

        await prisma.zone.delete({ where: { id } });

        await cache.delPattern("zones:*");
        await cache.delPattern("stores:nearby:*");

        res.json(new ApiResponse(200, null, "Zone deleted."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ASSIGN STORES TO ZONE
// POST /api/zones/:id/stores
// body: { storeIds: string[] }
// ═══════════════════════════════════════════════════════════════

export const assignStoresToZone = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { storeIds } = req.body;

        if (!storeIds?.length) throw new ApiError(400, "storeIds array is required.");

        const zone = await prisma.zone.findUnique({ where: { id } });
        if (!zone) throw new ApiError(404, "Zone not found.");

        // createMany with skipDuplicates to be idempotent
        const result = await prisma.storeZone.createMany({
            data: storeIds.map((storeId) => ({ storeId, zoneId: id })),
            skipDuplicates: true,
        });

        res.json(new ApiResponse(200, { count: result.count }, `${result.count} store(s) assigned to zone.`));

        // Zone membership change invalidates nearby store results
        await cache.del(`zones:detail:${id}`);
        await cache.delPattern("stores:nearby:*");
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// REMOVE STORE FROM ZONE
// DELETE /api/zones/:id/stores/:storeId
// ═══════════════════════════════════════════════════════════════

export const removeStoreFromZone = async (req, res, next) => {
    try {
        const { id, storeId } = req.params;

        await prisma.storeZone.deleteMany({ where: { zoneId: id, storeId } });

        await cache.del(`zones:detail:${id}`);
        await cache.delPattern("stores:nearby:*");

        res.json(new ApiResponse(200, null, "Store removed from zone."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ASSIGN DRIVERS TO ZONE
// POST /api/zones/:id/drivers
// body: { driverIds: string[] }
// ═══════════════════════════════════════════════════════════════

export const assignDriversToZone = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { driverIds } = req.body;

        if (!driverIds?.length) throw new ApiError(400, "driverIds array is required.");

        const zone = await prisma.zone.findUnique({ where: { id } });
        if (!zone) throw new ApiError(404, "Zone not found.");

        const result = await prisma.driverZone.createMany({
            data: driverIds.map((driverId) => ({ driverId, zoneId: id })),
            skipDuplicates: true,
        });

        res.json(new ApiResponse(200, { count: result.count }, `${result.count} driver(s) assigned to zone.`));

        await cache.del(`zones:detail:${id}`);
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// REMOVE DRIVER FROM ZONE
// DELETE /api/zones/:id/drivers/:driverId
// ═══════════════════════════════════════════════════════════════

export const removeDriverFromZone = async (req, res, next) => {
    try {
        const { id, driverId } = req.params;

        await prisma.driverZone.deleteMany({ where: { zoneId: id, driverId } });

        await cache.del(`zones:detail:${id}`);

        res.json(new ApiResponse(200, null, "Driver removed from zone."));
    } catch (err) {
        next(err);
    }
};
