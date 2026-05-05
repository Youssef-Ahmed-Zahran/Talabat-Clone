import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import {
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary,
} from "../../../utils/cloudinaryUpload.js";
import { getTenantPool, tenantQuery, tenantTransaction } from "../../../lib/tenantDb.js";
import prisma from "../../../config/db.js"; // Needed to fetch store info if necessary

// ═══════════════════════════════════════════════════════════════
// HELPER — get storeId for tenant routing
// ═══════════════════════════════════════════════════════════════
const getStoreId = async (req) => {
    let id = null;
    if (req.owner?.storeId) id = req.owner.storeId;
    else if (req.params?.storeId) id = req.params.storeId;
    else if (req.body?.storeId) id = req.body.storeId;
    else if (req.query?.storeId) id = req.query.storeId;

    if (!id) throw new ApiError(400, "storeId is required to determine the tenant schema.");

    // If it's an email, resolve it
    if (id.includes("@")) {
        const ownerAccount = await prisma.ownerAccount.findUnique({
            where: { email: id },
            select: { storeId: true },
        });
        if (!ownerAccount) {
            throw new ApiError(404, "Store not found for this owner email.");
        }
        return ownerAccount.storeId;
    }

    return id;
};

const verifyOwnership = (req, storeId) => {
    if (req.admin) return;
    if (req.owner?.storeId === storeId) return;
    throw new ApiError(403, "You can only manage your own store.");
};

// ═══════════════════════════════════════════════════════════════
// STORE SECTIONS (Menu sections)
// ═══════════════════════════════════════════════════════════════

export const createSection = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        verifyOwnership(req, storeId);

        const { name, sortOrder } = req.body;
        if (!name) throw new ApiError(400, "Name is required.");

        const [section] = await tenantQuery(storeId, `
            INSERT INTO store_sections (store_id, name, sort_order)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [storeId, name, sortOrder || 0]);

        res.status(201).json(new ApiResponse(201, section, "Section created."));
    } catch (err) {
        next(err);
    }
};

export const getSections = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);

        const sections = await tenantQuery(storeId, `
            SELECT 
                s.*, 
                (SELECT COUNT(*) FROM products p WHERE p.section_id = s.id) AS products_count,
                COALESCE(
                    (SELECT json_agg(prod_with_options ORDER BY prod_with_options.created_at DESC)
                     FROM (
                         SELECT 
                             p.id,
                             p.name,
                             p.description,
                             p.price,
                             p.primary_image_url AS "imageUrl",
                             p.is_available AS "isAvailable",
                             p.quantity,
                             p.meta,
                             p.created_at,
                             COALESCE(
                                 (SELECT json_agg(
                                     json_build_object(
                                         'id', g.id,
                                         'name', g.name,
                                         'isRequired', g.is_required,
                                         'minSelect', g.min_select,
                                         'maxSelect', g.max_select,
                                         'sortOrder', g.sort_order,
                                         'values', COALESCE(
                                             (SELECT json_agg(
                                                 json_build_object(
                                                     'id', v.id,
                                                     'name', v.name,
                                                     'extraPrice', v.extra_price
                                                 )
                                             )
                                             FROM product_option_values v
                                             WHERE v.option_group_id = g.id),
                                             '[]'::json
                                         )
                                     )
                                     ORDER BY g.sort_order ASC
                                 )
                                 FROM product_option_groups g
                                 WHERE g.product_id = p.id),
                                 '[]'::json
                             ) AS "optionGroups"
                         FROM products p
                         WHERE p.section_id = s.id AND p.is_available = true
                     ) AS prod_with_options
                    ),
                    '[]'::json
                ) AS products
            FROM store_sections s
            WHERE s.store_id = $1
            ORDER BY s.sort_order ASC
        `, [storeId]);

        res.json(new ApiResponse(200, sections, "Sections fetched."));
    } catch (err) {
        next(err);
    }
};

export const updateSection = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { sectionId } = req.params;
        const { name, sortOrder } = req.body;

        verifyOwnership(req, storeId);

        const [existing] = await tenantQuery(storeId, `SELECT id FROM store_sections WHERE id = $1`, [sectionId]);
        if (!existing) throw new ApiError(404, "Section not found.");

        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (name) { updates.push(`name = $${paramIdx++}`); params.push(name); }
        if (sortOrder !== undefined) { updates.push(`sort_order = $${paramIdx++}`); params.push(sortOrder); }

        if (updates.length === 0) {
            return res.json(new ApiResponse(200, existing, "No changes provided."));
        }

        params.push(sectionId);
        const [section] = await tenantQuery(storeId, `
            UPDATE store_sections 
            SET ${updates.join(", ")}
            WHERE id = $${paramIdx}
            RETURNING *
        `, params);

        res.json(new ApiResponse(200, section, "Section updated."));
    } catch (err) {
        next(err);
    }
};

export const deleteSection = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { sectionId } = req.params;
        verifyOwnership(req, storeId);

        const [existing] = await tenantQuery(storeId, `SELECT id FROM store_sections WHERE id = $1`, [sectionId]);
        if (!existing) throw new ApiError(404, "Section not found.");

        await tenantQuery(storeId, `DELETE FROM store_sections WHERE id = $1`, [sectionId]);

        res.json(new ApiResponse(200, null, "Section deleted."));
    } catch (err) {
        next(err);
    }
};

export const reorderSections = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        verifyOwnership(req, storeId);

        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) throw new ApiError(400, "orderedIds must be an array.");

        await tenantTransaction(storeId, async (client) => {
            for (let i = 0; i < orderedIds.length; i++) {
                await client.query(`UPDATE store_sections SET sort_order = $1 WHERE id = $2`, [i, orderedIds[i]]);
            }
        });

        res.json(new ApiResponse(200, null, "Sections reordered."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// RESTAURANT PRODUCTS
// ═══════════════════════════════════════════════════════════════

export const createProduct = async (req, res, next) => {
    let primaryImageUrl = null;
    let uploadedImages = [];

    try {
        const storeId = await getStoreId(req);
        verifyOwnership(req, storeId);

        const { 
            name, 
            description, 
            price, 
            quantity, 
            sectionId, 
            primaryImage, 
            images, 
            meta,
            optionGroups 
        } = req.body;
        
        if (!name || price === undefined) throw new ApiError(400, "Name and price are required.");

        // 1. Upload images to Cloudinary (Before DB transaction)
        if (primaryImage) {
            primaryImageUrl = await uploadToCloudinary(primaryImage, "products/restaurant");
        }

        if (images?.length) {
            uploadedImages = await uploadMultipleToCloudinary(images, "products/restaurant");
        }

        // 2. Perform all DB operations in a single atomic transaction
        const product = await tenantTransaction(storeId, async (client) => {
            // A. Create Product
            const { rows } = await client.query(`
                INSERT INTO products (store_id, section_id, name, description, price, quantity, primary_image_url, meta)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [storeId, sectionId || null, name, description || null, price, quantity || null, primaryImageUrl, meta || {}]);

            const p = rows[0];

            // B. Create Gallery Images
            if (uploadedImages.length > 0) {
                for (let i = 0; i < uploadedImages.length; i++) {
                    await client.query(`
                        INSERT INTO product_images (product_id, image_url, sort_order)
                        VALUES ($1, $2, $3)
                    `, [p.id, uploadedImages[i], i]);
                }
            }

            // C. Create Option Groups & Values (Nested Transactional Support)
            if (Array.isArray(optionGroups)) {
                for (let i = 0; i < optionGroups.length; i++) {
                    const group = optionGroups[i];
                    const { rows: gRows } = await client.query(`
                        INSERT INTO product_option_groups (product_id, name, is_required, min_select, max_select, sort_order)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING *
                    `, [p.id, group.name, group.isRequired || false, group.minSelect || 0, group.maxSelect || 1, group.sortOrder || i]);

                    const g = gRows[0];

                    if (Array.isArray(group.values)) {
                        for (const val of group.values) {
                            await client.query(`
                                INSERT INTO product_option_values (option_group_id, name, extra_price)
                                VALUES ($1, $2, $3)
                            `, [g.id, val.name, val.extraPrice || 0]);
                        }
                    }
                }
            }

            return p;
        });

        res.status(201).json(new ApiResponse(201, product, "Product created with all associations."));
    } catch (err) {
        // Rollback: Delete uploaded images from Cloudinary if the DB transaction fails
        const urlsToDelete = [...uploadedImages];
        if (primaryImageUrl) urlsToDelete.push(primaryImageUrl);
        
        if (urlsToDelete.length > 0) {
            deleteMultipleFromCloudinary(urlsToDelete).catch(e => 
                console.error("[Cloudinary Rollback Failed]:", e.message)
            );
        }
        
        next(err);
    }
};

export const getProducts = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { sectionId, search, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        let whereClause = `WHERE store_id = $1`;
        if (req.query.includeHidden !== 'true') {
            whereClause += ` AND is_available = true`;
        }

        const params = [storeId];
        let paramIdx = 2;

        if (sectionId) {
            whereClause += ` AND section_id = $${paramIdx++}`;
            params.push(sectionId);
        }
        if (search) {
            whereClause += ` AND name ILIKE $${paramIdx++}`;
            params.push(`%${search}%`);
        }

        const [{ count }] = await tenantQuery(storeId, `SELECT COUNT(*) FROM products ${whereClause}`, params);

        const products = await tenantQuery(storeId, `
            SELECT p.*,
                   json_agg(pi.*) as images
            FROM products p
            LEFT JOIN product_images pi ON pi.product_id = p.id
            ${whereClause}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT $${paramIdx++} OFFSET $${paramIdx++}
        `, [...params, Number(limit), skip]);

        res.json(new ApiResponse(200, {
            products,
            pagination: { total: Number(count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(Number(count) / Number(limit)) },
        }, "Products fetched."));
    } catch (err) {
        next(err);
    }
};

export const getProductById = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { productId } = req.params;

        const [product] = await tenantQuery(storeId, `
            SELECT p.*,
                   (SELECT json_agg(pi.*) FROM product_images pi WHERE pi.product_id = p.id) as images,
                   (SELECT row_to_json(s.*) FROM store_sections s WHERE s.id = p.section_id) as section,
                   (SELECT json_agg(row_to_json(g.*)) FROM (
                       SELECT pog.*, 
                              (SELECT json_agg(pov.*) FROM product_option_values pov WHERE pov.option_group_id = pog.id) as values
                       FROM product_option_groups pog
                       WHERE pog.product_id = p.id
                       ORDER BY pog.sort_order ASC
                   ) g) as option_groups
            FROM products p
            WHERE p.id = $1
        `, [productId]);

        if (!product) throw new ApiError(404, "Product not found.");

        res.json(new ApiResponse(200, product, "Product fetched."));
    } catch (err) {
        next(err);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { productId } = req.params;
        verifyOwnership(req, storeId);

        const [existing] = await tenantQuery(storeId, `SELECT * FROM products WHERE id = $1`, [productId]);
        if (!existing) throw new ApiError(404, "Product not found.");

        const { name, description, price, quantity, sectionId, isAvailable, primaryImage, meta } = req.body;
        let primaryImageUrl = existing.primary_image_url;

        if (primaryImage) {
            if (primaryImageUrl) await deleteFromCloudinary(primaryImageUrl);
            primaryImageUrl = await uploadToCloudinary(primaryImage, "products/restaurant");
        }

        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (name) { updates.push(`name = $${paramIdx++}`); params.push(name); }
        if (description !== undefined) { updates.push(`description = $${paramIdx++}`); params.push(description); }
        if (price !== undefined) { updates.push(`price = $${paramIdx++}`); params.push(price); }
        if (quantity !== undefined) { updates.push(`quantity = $${paramIdx++}`); params.push(quantity); }
        if (sectionId !== undefined) { updates.push(`section_id = $${paramIdx++}`); params.push(sectionId); }
        if (isAvailable !== undefined) { updates.push(`is_available = $${paramIdx++}`); params.push(isAvailable); }
        if (primaryImageUrl !== existing.primary_image_url) { updates.push(`primary_image_url = $${paramIdx++}`); params.push(primaryImageUrl); }
        if (meta !== undefined) { updates.push(`meta = $${paramIdx++}`); params.push(meta); }

        updates.push(`updated_at = NOW()`);
        params.push(productId);

        const [product] = await tenantQuery(storeId, `
            UPDATE products 
            SET ${updates.join(", ")}
            WHERE id = $${paramIdx}
            RETURNING *
        `, params);

        res.json(new ApiResponse(200, product, "Product updated."));
    } catch (err) {
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { productId } = req.params;
        verifyOwnership(req, storeId);

        const [existing] = await tenantQuery(storeId, `SELECT * FROM products WHERE id = $1`, [productId]);
        if (!existing) throw new ApiError(404, "Product not found.");

        const images = await tenantQuery(storeId, `SELECT image_url FROM product_images WHERE product_id = $1`, [productId]);
        
        const urlsToDelete = images.map((i) => i.image_url);
        if (existing.primary_image_url) urlsToDelete.push(existing.primary_image_url);
        if (urlsToDelete.length) await deleteMultipleFromCloudinary(urlsToDelete);

        await tenantQuery(storeId, `DELETE FROM products WHERE id = $1`, [productId]);

        res.json(new ApiResponse(200, null, "Product deleted."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// OPTION GROUPS & VALUES
// ═══════════════════════════════════════════════════════════════

export const createOptionGroup = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { productId } = req.params;
        verifyOwnership(req, storeId);

        const { name, isRequired, minSelect, maxSelect, sortOrder, parentOptionValueId, values } = req.body;
        if (!name) throw new ApiError(400, "Name is required.");

        const group = await tenantTransaction(storeId, async (client) => {
            const { rows } = await client.query(`
                INSERT INTO product_option_groups (product_id, name, is_required, min_select, max_select, sort_order, parent_option_value_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [productId, name, isRequired || false, minSelect || 0, maxSelect || 1, sortOrder || 0, parentOptionValueId || null]);

            const g = rows[0];
            g.values = [];

            let optionValues = [];
            if (values) {
                if (Array.isArray(values)) {
                    optionValues = values;
                } else if (typeof values === 'object') {
                    optionValues = [values];
                }
            }

            if (optionValues.length > 0) {
                for (const val of optionValues) {
                    if (!val.name) continue;
                    const { rows: vRows } = await client.query(`
                        INSERT INTO product_option_values (option_group_id, name, extra_price)
                        VALUES ($1, $2, $3)
                        RETURNING *
                    `, [g.id, val.name, val.extraPrice || 0]);
                    g.values.push(vRows[0]);
                }
            }
            return g;
        });

        res.status(201).json(new ApiResponse(201, group, "Option group created."));
    } catch (err) {
        next(err);
    }
};

export const getOptionGroups = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { productId } = req.params;

        const groups = await tenantQuery(storeId, `
            SELECT g.*, 
                (SELECT json_agg(v.*) FROM product_option_values v WHERE v.option_group_id = g.id) as values
            FROM product_option_groups g
            WHERE g.product_id = $1
            ORDER BY g.sort_order ASC
        `, [productId]);

        res.json(new ApiResponse(200, groups, "Option groups fetched."));
    } catch (err) {
        next(err);
    }
};

export const updateOptionGroup = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { groupId } = req.params;
        verifyOwnership(req, storeId);

        const { name, isRequired, minSelect, maxSelect, sortOrder, parentOptionValueId } = req.body;
        
        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (name) { updates.push(`name = $${paramIdx++}`); params.push(name); }
        if (isRequired !== undefined) { updates.push(`is_required = $${paramIdx++}`); params.push(isRequired); }
        if (minSelect !== undefined) { updates.push(`min_select = $${paramIdx++}`); params.push(minSelect); }
        if (maxSelect !== undefined) { updates.push(`max_select = $${paramIdx++}`); params.push(maxSelect); }
        if (sortOrder !== undefined) { updates.push(`sort_order = $${paramIdx++}`); params.push(sortOrder); }
        if (parentOptionValueId !== undefined) { updates.push(`parent_option_value_id = $${paramIdx++}`); params.push(parentOptionValueId); }

        if (updates.length === 0) return res.json(new ApiResponse(200, null, "No updates provided."));

        params.push(groupId);
        const [group] = await tenantQuery(storeId, `
            UPDATE product_option_groups
            SET ${updates.join(", ")}
            WHERE id = $${paramIdx}
            RETURNING *
        `, params);

        res.json(new ApiResponse(200, group, "Option group updated."));
    } catch (err) {
        next(err);
    }
};

export const deleteOptionGroup = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { groupId } = req.params;
        verifyOwnership(req, storeId);

        await tenantQuery(storeId, `DELETE FROM product_option_groups WHERE id = $1`, [groupId]);

        res.json(new ApiResponse(200, null, "Option group deleted."));
    } catch (err) {
        next(err);
    }
};

export const createOptionValue = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { groupId } = req.params;
        verifyOwnership(req, storeId);

        const { name, extraPrice } = req.body;
        if (!name) throw new ApiError(400, "Name is required.");

        const [value] = await tenantQuery(storeId, `
            INSERT INTO product_option_values (option_group_id, name, extra_price)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [groupId, name, extraPrice || 0]);

        res.status(201).json(new ApiResponse(201, value, "Option value created."));
    } catch (err) {
        next(err);
    }
};

export const getOptionValueById = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { valueId } = req.params;

        const [value] = await tenantQuery(storeId, `SELECT * FROM product_option_values WHERE id = $1`, [valueId]);
        if (!value) throw new ApiError(404, "Option value not found.");

        res.json(new ApiResponse(200, value, "Option value fetched."));
    } catch (err) {
        next(err);
    }
};

export const updateOptionValue = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { valueId } = req.params;
        verifyOwnership(req, storeId);

        const { name, extraPrice } = req.body;
        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (name) { updates.push(`name = $${paramIdx++}`); params.push(name); }
        if (extraPrice !== undefined) { updates.push(`extra_price = $${paramIdx++}`); params.push(extraPrice); }

        if (updates.length === 0) return res.json(new ApiResponse(200, null, "No updates provided."));

        params.push(valueId);
        const [value] = await tenantQuery(storeId, `
            UPDATE product_option_values
            SET ${updates.join(", ")}
            WHERE id = $${paramIdx}
            RETURNING *
        `, params);

        res.json(new ApiResponse(200, value, "Option value updated."));
    } catch (err) {
        next(err);
    }
};

export const deleteOptionValue = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        const { valueId } = req.params;
        verifyOwnership(req, storeId);

        await tenantQuery(storeId, `DELETE FROM product_option_values WHERE id = $1`, [valueId]);

        res.json(new ApiResponse(200, null, "Option value deleted."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// BULK ADD SECTIONS WITH PRODUCTS
// ═══════════════════════════════════════════════════════════════

export const bulkAddSections = async (req, res, next) => {
    try {
        const storeId = await getStoreId(req);
        verifyOwnership(req, storeId);

        const { sections } = req.body;
        if (!Array.isArray(sections) || sections.length === 0) throw new ApiError(400, "sections must be a non-empty array.");

        const result = await tenantTransaction(storeId, async (client) => {
            const createdSections = [];
            for (let i = 0; i < sections.length; i++) {
                const sec = sections[i];
                const { rows } = await client.query(`
                    INSERT INTO store_sections (store_id, name, sort_order)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `, [storeId, sec.name, sec.sortOrder ?? i]);
                
                const section = rows[0];
                const createdProducts = [];

                if (sec.products?.length) {
                    for (const p of sec.products) {
                        const { rows: pRows } = await client.query(`
                            INSERT INTO products (store_id, section_id, name, description, price, quantity, is_available, meta)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            RETURNING *
                        `, [storeId, section.id, p.name, p.description || null, p.price, p.quantity || null, p.isAvailable ?? true, p.meta || {}]);
                        createdProducts.push(pRows[0]);
                    }
                }
                createdSections.push({ ...section, products: createdProducts });
            }
            return createdSections;
        });

        res.status(201).json(new ApiResponse(201, result, `Bulk created ${result.length} section(s) with products.`));
    } catch (err) {
        next(err);
    }
};
