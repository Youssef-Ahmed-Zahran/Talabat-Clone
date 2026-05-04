import prisma from "../../../config/db.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

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

        const countries = await prisma.country.findMany({
            where: search
                ? { name: { contains: search, mode: "insensitive" } }
                : undefined,
            orderBy: { name: "asc" },
            select: { id: true, name: true, code: true },
        });

        // Nothing in DB yet — send the curated static list
        if (!countries.length && !search) {
            return res.json(
                new ApiResponse(200, STATIC_COUNTRIES, "Countries fetched (static fallback).")
            );
        }

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

        const country = await prisma.country.findUnique({
            where: { code: code.toUpperCase() },
            select: { id: true, name: true, code: true },
        });

        if (!country) {
            // Check static fallback
            const fallback = STATIC_COUNTRIES.find(c => c.code === code.toUpperCase());
            if (fallback) return res.json(new ApiResponse(200, fallback, "Country fetched (static)."));
            return res.status(404).json({ success: false, message: "Country not found." });
        }

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

        const country = await prisma.country.findUnique({
            where: { code: code.toUpperCase() },
            select: { id: true, name: true, code: true },
        });

        if (!country) {
            // Country hasn't been seeded yet — empty list is valid
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

        res.json(new ApiResponse(200, cities, "Cities fetched."));
    } catch (err) {
        next(err);
    }
};
