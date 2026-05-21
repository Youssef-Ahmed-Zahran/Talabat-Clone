import prisma from "../../../config/db.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { cache } from "../../../lib/cache.js";

// Static fallback list — used when DB has no countries seeded yet
const STATIC_COUNTRIES = [
    { id: null, name: "Egypt",                code: "EG" },
    { id: null, name: "Saudi Arabia",         code: "SA" },
    { id: null, name: "United Arab Emirates", code: "AE" },
    { id: null, name: "Kuwait",               code: "KW" },
    { id: null, name: "Qatar",                code: "QA" },
    { id: null, name: "Bahrain",              code: "BH" },
    { id: null, name: "Jordan",               code: "JO" },
    { id: null, name: "Lebanon",              code: "LB" },
    { id: null, name: "Iraq",                 code: "IQ" },
    { id: null, name: "Oman",                 code: "OM" },
];

// ═══════════════════════════════════════════════════════════════
// GET ALL COUNTRIES  —  GET /api/geography/countries?search=
// ═══════════════════════════════════════════════════════════════
export const getCountries = async (req, res, next) => {
    try {
        const { search } = req.query;
        const cacheKey = search ? null : "geography:countries:all";
        if (cacheKey) {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json(new ApiResponse(200, cached, "Countries fetched (cached)."));
        }

        const MIDDLE_EAST_CODES = STATIC_COUNTRIES.map(c => c.code);
        const dbCountries = await prisma.country.findMany({
            where: {
                code: { in: MIDDLE_EAST_CODES },
                ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
            },
            orderBy: { name: "asc" },
            select: { id: true, name: true, code: true },
        });

        const seen = new Set();
        const countries = dbCountries.filter(c => {
            if (seen.has(c.code)) return false;
            seen.add(c.code);
            return true;
        });

        if (!countries.length) {
            const filtered = search
                ? STATIC_COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
                : STATIC_COUNTRIES;
            return res.json(new ApiResponse(200, filtered, "Countries fetched (static fallback)."));
        }

        if (cacheKey) await cache.set(cacheKey, countries, 1800); // 30 minutes
        res.json(new ApiResponse(200, countries, "Countries fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET COUNTRY BY CODE  —  GET /api/geography/countries/:code
// ═══════════════════════════════════════════════════════════════
export const getCountryByCode = async (req, res, next) => {
    try {
        const { code } = req.params;
        const upperCode = code.toUpperCase();
        const cacheKey = `geography:country:${upperCode}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(new ApiResponse(200, cached, "Country fetched (cached)."));

        const country = await prisma.country.findUnique({
            where: { code: upperCode },
            select: { id: true, name: true, code: true },
        });

        if (!country) {
            const fallback = STATIC_COUNTRIES.find(c => c.code === upperCode);
            if (fallback) return res.json(new ApiResponse(200, fallback, "Country fetched (static)."));
            return res.status(404).json({ success: false, message: "Country not found." });
        }

        await cache.set(cacheKey, country, 1800);
        res.json(new ApiResponse(200, country, "Country fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET CITIES BY COUNTRY  —  GET /api/geography/countries/:code/cities
// ═══════════════════════════════════════════════════════════════
export const getCitiesByCountry = async (req, res, next) => {
    try {
        const { code } = req.params;
        const { search } = req.query;
        const upperCode = code.toUpperCase();
        const cacheKey = search ? null : `geography:cities:country_${upperCode}`;
        if (cacheKey) {
            const cached = await cache.get(cacheKey);
            if (cached) return res.json(new ApiResponse(200, cached, "Cities fetched (cached)."));
        }

        const country = await prisma.country.findUnique({
            where: { code: upperCode },
            select: { id: true, name: true, code: true },
        });

        if (!country) {
            return res.json(new ApiResponse(200, [], "No cities found for this country yet."));
        }

        const cities = await prisma.city.findMany({
            where: {
                countryId: country.id,
                ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
            },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                governorate: { select: { id: true, name: true } },
            },
        });

        if (cacheKey) await cache.set(cacheKey, cities, 1800); // 30 minutes
        res.json(new ApiResponse(200, cities, "Cities fetched."));
    } catch (err) {
        next(err);
    }
};
