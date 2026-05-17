import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { tenantQuery, tenantTransaction } from "../../../lib/tenantDb.js";

// ═══════════════════════════════════════════════════════════════
// GET CART
// ═══════════════════════════════════════════════════════════════

export const getCart = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const userId = req.user.id;

        const cart = await prisma.cart.findUnique({
            where: { userId_storeId: { userId, storeId } },
        });

        if (!cart) {
            return res.json(new ApiResponse(200, null, "Cart is empty."));
        }

        const items = await tenantQuery(storeId, `
            SELECT ci.*,
                ci.base_price AS "unitPrice",
                row_to_json(p.*) AS product,
                (SELECT COALESCE(json_agg(row_to_json(o.*)), '[]'::json)
                    FROM (
                        SELECT cio.id,
                            cio.cart_item_id AS "cartItemId",
                            cio.option_value_id AS "optionValueId",
                            json_build_object(
                                'id', pov.id,
                                'name', pov.name,
                                'extraPrice', pov.extra_price
                            ) AS "optionValue"
                        FROM cart_item_options cio
                        JOIN product_option_values pov ON pov.id = cio.option_value_id
                        WHERE cio.cart_item_id = ci.id
                    ) o) AS options
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = $1
        `, [cart.id]);

        cart.items = items;

        res.json(new ApiResponse(200, cart, "Cart fetched."));
    } catch (err) {
        next(err);
    }
};



// ═══════════════════════════════════════════════════════════════
// ADD UNIVERSAL ITEM
// ═══════════════════════════════════════════════════════════════

export const addItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { storeId, productId, quantity, selectedOptions } = req.body;

        if (!storeId || !productId || !quantity) throw new ApiError(400, "storeId, productId, and quantity are required.");

        const [product] = await tenantQuery(storeId, `SELECT * FROM products WHERE id = $1`, [productId]);
        if (!product || !product.is_available) throw new ApiError(404, "Product not found or unavailable.");

        let cart = await prisma.cart.findUnique({ where: { userId_storeId: { userId, storeId } } });
        if (!cart) cart = await prisma.cart.create({ data: { userId, storeId } });

        const allItems = await tenantTransaction(storeId, async (client) => {
            const { rows } = await client.query(`
                INSERT INTO cart_items (cart_id, product_id, quantity, base_price)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (cart_id, product_id)
                DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
                RETURNING *
            `, [cart.id, productId, quantity, product.price]);

            const cartItem = rows[0];

            if (selectedOptions?.length) {
                const groupMap = {};
                for (const optId of selectedOptions) {
                    const { rows: ovRows } = await client.query(`
                        SELECT v.extra_price, v.name, g.id as group_id, g.name as group_name, g.max_select
                        FROM product_option_values v
                        JOIN product_option_groups g ON g.id = v.option_group_id
                        WHERE v.id = $1
                    `, [optId]);

                    if (ovRows.length) {
                        const ov = ovRows[0];
                        if (!groupMap[ov.group_id]) groupMap[ov.group_id] = 0;
                        groupMap[ov.group_id]++;

                        if (ov.max_select && groupMap[ov.group_id] > ov.max_select) {
                            throw new ApiError(400, `You can only select up to ${ov.max_select} options from group "${ov.group_name}".`);
                        }

                        await client.query(`
                            INSERT INTO cart_item_options (cart_item_id, option_value_id, extra_price)
                            VALUES ($1, $2, $3)
                            ON CONFLICT DO NOTHING
                        `, [cartItem.id, optId, ov.extra_price]);
                    }
                }
            }

            // Return ALL items in the cart so the client gets the full up-to-date state
            const { rows: cartRows } = await client.query(`
                SELECT ci.*,
                       ci.base_price AS "unitPrice",
                       row_to_json(p.*) AS product,
                       (SELECT COALESCE(json_agg(row_to_json(o.*)), '[]'::json)
                        FROM (
                            SELECT cio.id,
                                   cio.cart_item_id AS "cartItemId",
                                   cio.option_value_id AS "optionValueId",
                                   json_build_object(
                                       'id', pov.id,
                                       'name', pov.name,
                                       'extraPrice', pov.extra_price
                                   ) AS "optionValue"
                            FROM cart_item_options cio
                            JOIN product_option_values pov ON pov.id = cio.option_value_id
                            WHERE cio.cart_item_id = ci.id
                        ) o) AS options
                FROM cart_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.cart_id = $1
            `, [cart.id]);

            return cartRows;
        });

        // Return full cart shape that the mobile store expects
        const fullCart = {
            id: cart.id,
            storeId: cart.storeId,
            userId: cart.userId,
            items: allItems,
        };

        res.status(201).json(new ApiResponse(201, fullCart, "Item added to cart."));
    } catch (err) {
        next(err);
    }
};


// ═══════════════════════════════════════════════════════════════
// UPDATE ITEM QUANTITY
// ═══════════════════════════════════════════════════════════════

export const updateItemQuantity = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { quantity, storeId } = req.body;

        if (!quantity || quantity < 1) throw new ApiError(400, "Quantity must be at least 1.");
        if (!storeId) throw new ApiError(400, "storeId is required.");

        const [existing] = await tenantQuery(storeId, `SELECT id, cart_id FROM cart_items WHERE id = $1`, [itemId]);
        if (!existing) throw new ApiError(404, "Cart item not found.");

        await tenantQuery(storeId, `UPDATE cart_items SET quantity = $1 WHERE id = $2`, [quantity, itemId]);

        // Return full cart state
        const items = await tenantQuery(storeId, `
            SELECT ci.*,
                   ci.base_price AS "unitPrice",
                   row_to_json(p.*) AS product,
                   (SELECT COALESCE(json_agg(row_to_json(o.*)), '[]'::json)
                    FROM (
                        SELECT cio.id,
                               cio.cart_item_id AS "cartItemId",
                               cio.option_value_id AS "optionValueId",
                               json_build_object(
                                   'id', pov.id,
                                   'name', pov.name,
                                   'extraPrice', pov.extra_price
                               ) AS "optionValue"
                        FROM cart_item_options cio
                        JOIN product_option_values pov ON pov.id = cio.option_value_id
                        WHERE cio.cart_item_id = ci.id
                    ) o) AS options
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = $1
        `, [existing.cart_id]);

        const cart = await prisma.cart.findUnique({ where: { id: existing.cart_id } });
        
        res.json(new ApiResponse(200, { ...cart, items }, "Quantity updated."));
    } catch (err) {
        next(err);
    }
};

export const removeItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { storeId } = req.query;

        if (!storeId) throw new ApiError(400, "storeId query param is required.");

        const [existing] = await tenantQuery(storeId, `SELECT id, cart_id FROM cart_items WHERE id = $1`, [itemId]);
        if (!existing) throw new ApiError(404, "Cart item not found.");

        await tenantQuery(storeId, `DELETE FROM cart_items WHERE id = $1`, [itemId]);

        // Return full cart state
        const items = await tenantQuery(storeId, `
            SELECT ci.*,
                   ci.base_price AS "unitPrice",
                   row_to_json(p.*) AS product,
                   (SELECT COALESCE(json_agg(row_to_json(o.*)), '[]'::json)
                    FROM (
                        SELECT cio.id,
                               cio.cart_item_id AS "cartItemId",
                               cio.option_value_id AS "optionValueId",
                               json_build_object(
                                   'id', pov.id,
                                   'name', pov.name,
                                   'extraPrice', pov.extra_price
                               ) AS "optionValue"
                        FROM cart_item_options cio
                        JOIN product_option_values pov ON pov.id = cio.option_value_id
                        WHERE cio.cart_item_id = ci.id
                    ) o) AS options
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = $1
        `, [existing.cart_id]);

        const cart = await prisma.cart.findUnique({ where: { id: existing.cart_id } });

        res.json(new ApiResponse(200, { ...cart, items }, "Item removed from cart."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// CLEAR CART
// ═══════════════════════════════════════════════════════════════

export const clearCart = async (req, res, next) => {
    try {
        const { cartId } = req.params;

        const cart = await prisma.cart.findFirst({ where: { id: cartId, userId: req.user.id } });
        if (!cart) throw new ApiError(404, "Cart not found.");

        await prisma.cart.delete({ where: { id: cartId } });

        res.json(new ApiResponse(200, null, "Cart cleared."));
    } catch (err) {
        next(err);
    }
};
