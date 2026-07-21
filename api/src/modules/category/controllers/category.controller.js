import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../../utils/cloudinaryUpload.js";
import { cache } from "../../../lib/cache.js";

// ═══════════════════════════════════════════════════════════════
// MAIN CATEGORIES
// ═══════════════════════════════════════════════════════════════

/** GET /api/categories */
export const getAllMainCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = search
      ? { name: { contains: search, mode: "insensitive" }, isActive: true }
      : { isActive: true };

    const cacheKey = search ? null : `categories:main:p_${page}:l_${limit}`;
    if (cacheKey) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(new ApiResponse(200, cached, "Main categories fetched (cached)."));
      }
    }

    const [categories, total] = await Promise.all([
      prisma.mainCategory.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { subCategories: true, stores: true } },
        },
      }),
      prisma.mainCategory.count({ where }),
    ]);

    const responseData = {
      categories,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };

    if (cacheKey) {
      await cache.set(cacheKey, responseData, 600); // 10 min
    }

    res.json(new ApiResponse(200, responseData, "Main categories fetched."));
  } catch (err) {
    next(err);
  }
};

/** GET /api/categories/:id */
export const getMainCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cacheKey = `categories:main:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(new ApiResponse(200, cached, "Main category fetched (cached)."));
    }

    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        subCategories: { orderBy: { name: "asc" } },
        _count: { select: { stores: true } },
      },
    });

    if (!category) {
      throw new ApiError(404, "Main category not found.");
    }

    await cache.set(cacheKey, category, 600);

    res.json(new ApiResponse(200, category, "Main category fetched."));
  } catch (err) {
    next(err);
  }
};

/** GET /api/categories/:id/sub-categories */
export const getSubCategories = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cacheKey = `categories:sub:parent_${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(new ApiResponse(200, cached, "Sub-categories fetched (cached)."));
    }

    const subCategories = await prisma.subCategory.findMany({
      where: { mainCategoryId: id, isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { storeLinks: true } },
      },
    });

    await cache.set(cacheKey, subCategories, 600);

    res.json(new ApiResponse(200, subCategories, "Sub-categories fetched."));
  } catch (err) {
    next(err);
  }
};

/** POST /api/categories — Admin */
export const createMainCategory = async (req, res, next) => {
  try {
    const { name, image, isActive } = req.body;

    if (!name) {
      throw new ApiError(400, "Name is required.");
    }

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadToCloudinary(image, "categories");
    }

    const category = await prisma.mainCategory.create({
      data: { name, imageUrl, ...(isActive !== undefined && { isActive }) },
    });

    await cache.delPattern("categories:*");

    res
      .status(201)
      .json(new ApiResponse(201, category, "Main category created."));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/categories/:id — Admin */
export const updateMainCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, image, isActive } = req.body;

    const existing = await prisma.mainCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Main category not found.");
    }

    let imageUrl = existing.imageUrl;
    if (image && !image.startsWith("http")) {
      if (existing.imageUrl) {
        await deleteFromCloudinary(existing.imageUrl);
      }
      imageUrl = await uploadToCloudinary(image, "categories");
    }

    const category = await prisma.mainCategory.update({
      where: { id },
      data: { ...(name && { name }), imageUrl, ...(isActive !== undefined && { isActive }) },
    });

    await cache.delPattern("categories:*");

    res.json(new ApiResponse(200, category, "Main category updated."));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/categories/:id — Admin */
export const deleteMainCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.mainCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Main category not found.");
    }

    if (existing.imageUrl) {
      await deleteFromCloudinary(existing.imageUrl);
    }

    await prisma.mainCategory.delete({ where: { id } });

    await cache.delPattern("categories:*");

    res.json(new ApiResponse(200, null, "Main category deleted."));
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════
// SUB-CATEGORIES
// ═══════════════════════════════════════════════════════════════

/** POST /api/categories/:id/sub-categories — Admin */
export const createSubCategory = async (req, res, next) => {
  try {
    const { id: mainCategoryId } = req.params;
    const { name, image, isActive } = req.body;

    if (!name) {
      throw new ApiError(400, "Name is required.");
    }

    const mainCategory = await prisma.mainCategory.findUnique({
      where: { id: mainCategoryId },
    });
    if (!mainCategory) {
      throw new ApiError(404, "Main category not found.");
    }

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadToCloudinary(image, "categories/sub");
    }

    const subCategory = await prisma.subCategory.create({
      data: { name, mainCategoryId, imageUrl, ...(isActive !== undefined && { isActive }) },
    });

    await cache.delPattern("categories:*");

    res
      .status(201)
      .json(new ApiResponse(201, subCategory, "Sub-category created."));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/categories/sub-categories/:subId — Admin */
export const updateSubCategory = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const { name, image, isActive } = req.body;

    const existing = await prisma.subCategory.findUnique({
      where: { id: subId },
    });
    if (!existing) {
      throw new ApiError(404, "Sub-category not found.");
    }

    let imageUrl = existing.imageUrl;
    if (image && !image.startsWith("http")) {
      if (existing.imageUrl) {
        await deleteFromCloudinary(existing.imageUrl);
      }
      imageUrl = await uploadToCloudinary(image, "categories/sub");
    }

    const subCategory = await prisma.subCategory.update({
      where: { id: subId },
      data: { ...(name && { name }), imageUrl, ...(isActive !== undefined && { isActive }) },
    });

    await cache.delPattern("categories:*");

    res.json(new ApiResponse(200, subCategory, "Sub-category updated."));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/categories/sub-categories/:subId — Admin */
export const deleteSubCategory = async (req, res, next) => {
  try {
    const { subId } = req.params;

    const existing = await prisma.subCategory.findUnique({
      where: { id: subId },
    });
    if (!existing) {
      throw new ApiError(404, "Sub-category not found.");
    }

    if (existing.imageUrl) {
      await deleteFromCloudinary(existing.imageUrl);
    }

    await prisma.subCategory.delete({ where: { id: subId } });

    await cache.delPattern("categories:*");

    res.json(new ApiResponse(200, null, "Sub-category deleted."));
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════
// STORE ↔ SUB-CATEGORY LINKS
// ═══════════════════════════════════════════════════════════════

/** POST /api/categories/sub-categories/:subId/stores — Admin */
export const linkStoreToSubCategory = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const { storeId } = req.body;

    if (!storeId) throw new ApiError(400, "storeId is required.");

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subId },
    });
    if (!subCategory) throw new ApiError(404, "Sub-category not found.");

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new ApiError(404, "Store not found.");

    // Check if already linked
    const existing = await prisma.storeSubCategory.findUnique({
      where: { storeId_subCategoryId: { storeId, subCategoryId: subId } },
    });
    if (existing)
      throw new ApiError(409, "Store is already linked to this sub-category.");

    const link = await prisma.storeSubCategory.create({
      data: { storeId, subCategoryId: subId },
      include: {
        store: { select: { id: true, name: true, logoUrl: true } },
        subCategory: { select: { id: true, name: true } },
      },
    });

    // Linking a store changes sub-category store counts
    await cache.delPattern("categories:*");
    await cache.delPattern("stores:*"); // store detail includes its categories

    res
      .status(201)
      .json(new ApiResponse(201, link, "Store linked to sub-category."));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/categories/sub-categories/:subId/stores/:storeId — Admin */
export const unlinkStoreFromSubCategory = async (req, res, next) => {
  try {
    const { subId, storeId } = req.params;

    const link = await prisma.storeSubCategory.findUnique({
      where: { storeId_subCategoryId: { storeId, subCategoryId: subId } },
    });
    if (!link) throw new ApiError(404, "Link not found.");

    await prisma.storeSubCategory.delete({ where: { id: link.id } });

    await cache.delPattern("categories:*");
    await cache.delPattern("stores:*");

    res.json(new ApiResponse(200, null, "Store unlinked from sub-category."));
  } catch (err) {
    next(err);
  }
};

/** GET /api/categories/sub-categories/:subId/stores — Public */
export const getStoresInSubCategory = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subId },
    });
    if (!subCategory) throw new ApiError(404, "Sub-category not found.");

    const where = { subCategoryId: subId, store: { isActive: true } };

    const [links, total] = await Promise.all([
      prisma.storeSubCategory.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          store: {
            select: {
              id: true,
              name: true,
              description: true,
              logoUrl: true,
              coverUrl: true,
              storeType: true,
              deliveryType: true,
              deliveryTimeMinutes: true,
              minimumOrderCost: true,
              deliveryFees: true,
              averageRating: true,
              totalReviews: true,
              city: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.storeSubCategory.count({ where }),
    ]);

    const stores = links.map((l) => ({
      ...l.store,
      storeType: l.store.storeType?.name || l.store.storeType,
    }));

    res.json(
      new ApiResponse(
        200,
        {
          subCategory: { id: subCategory.id, name: subCategory.name },
          stores,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
        "Stores in sub-category fetched.",
      ),
    );
  } catch (err) {
    next(err);
  }
};

/** GET /api/categories/sub-categories/:subId/stores/all — Admin */
export const getAllStoresInSubCategoryAdmin = async (req, res, next) => {
  try {
    const { subId } = req.params;

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subId },
    });
    if (!subCategory) throw new ApiError(404, "Sub-category not found.");

    const where = { subCategoryId: subId };

    const links = await prisma.storeSubCategory.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            storeType: true,
            isActive: true,
          },
        },
      },
    });

    const stores = links.map((l) => ({
      ...l.store,
      storeType: l.store.storeType?.name || l.store.storeType,
    }));

    res.json(
      new ApiResponse(
        200,
        {
          subCategory: { id: subCategory.id, name: subCategory.name },
          stores,
        },
        "All stores in sub-category fetched (Admin).",
      ),
    );
  } catch (err) {
    next(err);
  }
};
