import { Router } from "express";
import {
    getCountries,
    getCountryByCode,
    getCitiesByCountry,
} from "../controllers/geography.controller.js";

const router = Router();

// GET /api/geography/countries?search=egypt
router.get("/countries", getCountries);

// GET /api/geography/countries/EG
router.get("/countries/:code", getCountryByCode);

// GET /api/geography/countries/EG/cities?search=cairo
router.get("/countries/:code/cities", getCitiesByCountry);

export default router;
