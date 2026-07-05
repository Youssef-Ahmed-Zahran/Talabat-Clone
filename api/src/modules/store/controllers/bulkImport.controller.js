/**
 * bulkImport.controller.js
 *
 * POST /api/stores/bulk-import
 *
 * Accepts a multipart/form-data Excel (.xlsx) file with store rows.
 * - Parses and validates every row
 * - Hashes passwords in parallel (bcrypt cost 8 for speed)
 * - Creates stores + owner accounts in DB batches of 50
 * - Skips Cloudinary image upload (set logo/cover individually after import)
 * - Skips tenant schema provisioning (lazily provisioned on owner first login)
 * - Returns { created, failed, errors: [{ row, reason }] }
 *
 * Lazy provisioning: the owner login route (POST /api/auth/owner/login)
 * checks if the tenant schema exists and provisions it on the fly if missing.
 */

import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { resolveGeographyData } from "../../../utils/geography.util.js";
import { detectZone } from "../../zone/controllers/zone.controller.js";
import { cache } from "../../../lib/cache.js";

// ── Constants ──────────────────────────────────────────────────────────────────
const BATCH_SIZE = 50;
const BCRYPT_COST = 8; // lower cost for bulk (vs. 12 for single store)

const REQUIRED_COLUMNS = [
    "name",
    "ownerEmail",
    "ownerPassword",
    "mainCategoryId",
    "storeType",
    "deliveryType",
    "cityName",
    "countryName",
    "countryCode",
    "latitude",
    "longitude",
];

const VALID_DELIVERY_TYPES = ["TALABAT_DELIVERY", "STORE_DELIVERY"];

// ── Helper: parse & normalise a single row from the sheet ────────────────────
function parseRow(raw) {
    const row = {};
    // Trim string fields; leave numbers/booleans as-is
    for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "string") row[k] = v.trim();
        else row[k] = v;
    }
    return row;
}

// ── Helper: validate one row. Returns an error string or null ────────────────
function validateRow(row, rowIndex) {
    for (const col of REQUIRED_COLUMNS) {
        if (!row[col] && row[col] !== 0) {
            return `Missing required field: "${col}"`;
        }
    }
    if (!VALID_DELIVERY_TYPES.includes(row.deliveryType)) {
        return `Invalid deliveryType "${row.deliveryType}". Must be TALABAT_DELIVERY or STORE_DELIVERY`;
    }
    if (isNaN(Number(row.latitude)) || isNaN(Number(row.longitude))) {
        return `latitude / longitude must be numeric`;
    }
    if (String(row.ownerPassword).length < 6) {
        return `ownerPassword must be at least 6 characters`;
    }
    return null;
}

// ── Helper: create a single store row (no images, no schema provisioning) ────
async function createSingleStore(row) {
    const {
        name,
        description,
        legalName,
        phone,
        email,
        address,
        mainCategoryId,
        storeType,
        deliveryType,
        cityName,
        governorateName,
        countryName,
        countryCode,
        latitude,
        longitude,
        ownerEmail,
        ownerPassword,
        openTime,
        closeTime,
        deliveryTimeMinutes,
        minimumOrderCost,
        deliveryFees,
        commissionRate,
        maxDeliveryDistanceKm,
        outsideZoneDeliveryFees,
        allowPreorder,
        zoneId,
    } = row;

    // Resolve geography (find-or-create country / city)
    const resolvedGeo = await resolveGeographyData({
        cityName,
        governorateName: governorateName || null,
        countryName,
        countryCode,
    });

    // Verify main category exists (can be ID or Name)
    let mainCat;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(mainCategoryId));
    
    if (isUUID) {
        mainCat = await prisma.mainCategory.findUnique({
            where: { id: String(mainCategoryId) },
        });
    } else {
        mainCat = await prisma.mainCategory.findFirst({
            where: { name: { equals: String(mainCategoryId), mode: "insensitive" } },
        });
    }

    if (!mainCat) throw new Error(`Main Category "${mainCategoryId}" not found`);

    // Pre-hashed password is passed in from the batch processor
    // ownerPassword here is already a bcrypt hash
    const passwordHash = ownerPassword;

    return await prisma.$transaction(async (tx) => {
        const store = await tx.store.create({
            data: {
                name: String(name),
                description: description ? String(description) : null,
                legalName: legalName ? String(legalName) : null,
                phone: phone ? String(phone) : null,
                email: email ? String(email) : null,
                address: address ? String(address) : null,
                mainCategory: { connect: { id: mainCat.id } },
                city: { connect: { id: resolvedGeo.cityId } },
                storeType: String(storeType),
                deliveryType: String(deliveryType),
                openTime: openTime ? String(openTime) : "09:00",
                closeTime: closeTime ? String(closeTime) : "23:00",
                deliveryTimeMinutes: deliveryTimeMinutes ? parseInt(deliveryTimeMinutes) : 30,
                minimumOrderCost: minimumOrderCost ? Number(minimumOrderCost) : 0,
                deliveryFees: deliveryFees ? Number(deliveryFees) : 0,
                maxDeliveryDistanceKm: maxDeliveryDistanceKm ? Number(maxDeliveryDistanceKm) : null,
                outsideZoneDeliveryFees: outsideZoneDeliveryFees ? Number(outsideZoneDeliveryFees) : null,
                commissionRate: commissionRate ? Number(commissionRate) : 0,
                allowPreorder: allowPreorder === true || allowPreorder === "true" || allowPreorder === 1,
                latitude: Number(latitude),
                longitude: Number(longitude),
                // No logo/cover in bulk import — set individually after
                logoUrl: null,
                coverUrl: null,
            },
        });

        await tx.ownerAccount.create({
            data: {
                storeId: store.id,
                email: String(ownerEmail),
                passwordHash,
            },
        });

        // Auto-detect zone by coordinates
        if (!zoneId && latitude && longitude) {
            const detectedZone = await detectZone(Number(latitude), Number(longitude));
            if (detectedZone) {
                await tx.storeZone.create({
                    data: { storeId: store.id, zoneId: detectedZone.id },
                });
            }
        } else if (zoneId) {
            await tx.storeZone.create({
                data: { storeId: store.id, zoneId: String(zoneId) },
            });
        }

        return store.id;
    });
}

// ── Main controller ────────────────────────────────────────────────────────────
export const bulkImportStores = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError(400, "No file uploaded. Please attach an .xlsx file.");
        }

        // Parse Excel from memory buffer
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new ApiError(400, "The Excel file has no sheets.");

        const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            defval: "",
            raw: false, // convert everything to strings first; we parse numbers ourselves
        });

        if (!rawRows.length) {
            throw new ApiError(400, "The Excel sheet is empty.");
        }

        if (rawRows.length > 10000) {
            throw new ApiError(400, `Too many rows: ${rawRows.length}. Maximum is 10,000 per upload.`);
        }

        // ── Phase 1: Validate all rows ──────────────────────────────────────
        const validRows = [];
        const validationErrors = [];

        for (let i = 0; i < rawRows.length; i++) {
            const row = parseRow(rawRows[i]);
            const rowNumber = i + 2; // Excel row 1 = header, data starts at 2

            const validationError = validateRow(row, rowNumber);
            if (validationError) {
                validationErrors.push({ row: rowNumber, reason: validationError });
                continue;
            }

            validRows.push({ ...row, _rowNumber: rowNumber });
        }

        // ── Phase 2: Check email uniqueness in bulk (one DB query) ───────────
        const emailSet = new Set();
        const duplicatesInFile = [];

        for (const row of validRows) {
            const email = String(row.ownerEmail).toLowerCase();
            if (emailSet.has(email)) {
                validationErrors.push({
                    row: row._rowNumber,
                    reason: `Duplicate ownerEmail in file: "${row.ownerEmail}"`,
                });
                duplicatesInFile.push(row._rowNumber);
            } else {
                emailSet.add(email);
            }
        }

        // Remove duplicated-in-file rows
        const deduplicatedRows = validRows.filter(
            (r) => !duplicatesInFile.includes(r._rowNumber)
        );

        // Check against existing DB emails
        const existingOwners = await prisma.ownerAccount.findMany({
            where: {
                email: { in: [...emailSet], mode: "insensitive" },
            },
            select: { email: true },
        });
        const existingEmailSet = new Set(existingOwners.map((o) => o.email.toLowerCase()));

        const rowsToCreate = [];
        for (const row of deduplicatedRows) {
            if (existingEmailSet.has(String(row.ownerEmail).toLowerCase())) {
                validationErrors.push({
                    row: row._rowNumber,
                    reason: `Owner email "${row.ownerEmail}" already exists in the system`,
                });
            } else {
                rowsToCreate.push(row);
            }
        }

        if (!rowsToCreate.length) {
            return res.status(422).json(
                new ApiResponse(422, {
                    created: 0,
                    failed: rawRows.length,
                    errors: validationErrors,
                }, "No valid rows to import.")
            );
        }

        // ── Phase 3: Hash all passwords in parallel ──────────────────────────
        await Promise.all(
            rowsToCreate.map(async (row) => {
                row._hashedPassword = await bcrypt.hash(String(row.ownerPassword), BCRYPT_COST);
            })
        );

        // ── Phase 4: Process in batches of BATCH_SIZE ────────────────────────
        let created = 0;
        const importErrors = [...validationErrors];

        for (let i = 0; i < rowsToCreate.length; i += BATCH_SIZE) {
            const batch = rowsToCreate.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map((row) =>
                    createSingleStore({
                        ...row,
                        ownerPassword: row._hashedPassword, // pass pre-hashed value
                    })
                )
            );

            for (let j = 0; j < results.length; j++) {
                const result = results[j];
                const row = batch[j];
                if (result.status === "fulfilled") {
                    created++;
                } else {
                    importErrors.push({
                        row: row._rowNumber,
                        reason: result.reason?.message || "Unknown error",
                    });
                }
            }
        }

        // Clear store list cache
        await cache.delPattern("stores:*");

        const failed = rawRows.length - created;

        res.status(201).json(
            new ApiResponse(201, {
                total: rawRows.length,
                created,
                failed,
                errors: importErrors,
            }, `Bulk import complete: ${created} created, ${failed} failed.`)
        );
    } catch (err) {
        next(err);
    }
};
