import prisma from "../config/db.js";

/**
 * Resolves geography records (Country, Governorate, City) from strings.
 * Creates them on the fly if they don't exist.
 *
 * @param {Object} params
 * @param {string} params.countryName 
 * @param {string} params.countryCode 
 * @param {string} [params.governorateName] 
 * @param {string} params.cityName 
 * @returns {Promise<{ countryId: string, governorateId: string | null, cityId: string }>}
 */
export const resolveGeographyData = async ({
    countryName,
    countryCode,
    governorateName,
    cityName,
}) => {
    if (!countryName || !countryCode || !cityName) {
        throw new Error("countryName, countryCode, and cityName are required to resolve geography.");
    }

    // 1. Find or create Country
    let country = await prisma.country.findUnique({
        where: { code: countryCode },
    });

    if (!country) {
        country = await prisma.country.create({
            data: {
                name: countryName,
                code: countryCode,
            },
        });
    }

    // 2. Find or create Governorate (if provided)
    let governorateId = null;
    if (governorateName) {
        let governorate = await prisma.governorate.findUnique({
            where: {
                name_countryId: {
                    name: governorateName,
                    countryId: country.id,
                },
            },
        });

        if (!governorate) {
            governorate = await prisma.governorate.create({
                data: {
                    name: governorateName,
                    countryId: country.id,
                },
            });
        }
        governorateId = governorate.id;
    }

    // 3. Find or create City
    const cityWhere = governorateId
        ? {
            countryId: country.id,
            governorateId,
            name: cityName,
        }
        : {
            countryId: country.id,
            name: cityName,
        };

    let city = await prisma.city.findFirst({
        where: cityWhere,
    });

    if (!city) {
        city = await prisma.city.create({
            data: {
                name: cityName,
                countryId: country.id,
                governorateId,
            },
        });
    }

    return {
        countryId: country.id,
        governorateId,
        cityId: city.id,
    };
};
