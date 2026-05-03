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
            include: {
                store: {
                    select: {
                        id: true, name: true, logoUrl: true, storeType: true,
                        minimumOrderCost: true, deliveryFees: true, deliveryTimeMinutes: true,
                    },
                },
            },
        });

        if (!cart) {
            return res.json(new ApiResponse(200, null, "Cart is empty."));
        }

        const storeType = cart.store.storeType;
        let items = [];

        if (storeType === "RESTAURANT") {
            items = await tenantQuery(storeId, `
                SELECT ci.*, 
                       row_to_json(p.*) as product,
                       (SELECT json_agg(row_to_json(o.*)) 
                        FROM (
                            SELECT cio.*, row_to_json(pov.*) as option_value 
                            FROM cart_item_options cio
                            JOIN product_option_values pov ON pov.id = cio.option_value_id
                            WHERE cio.cart_item_id = ci.id
                        ) o) as options
                FROM cart_item_products ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.cart_id = $1
            `, [cart.id]);
            cart.restaurantItems = items;
        } else if (storeType === "GROCERY") {
            items = await tenantQuery(storeId, `
                SELECT ci.*, 
                       row_to_json(p.*) as product,
                       (SELECT json_agg(row_to_json(o.*)) 
                        FROM (
                            SELECT cio.*, row_to_json(pov.*) as option_value 
                            FROM cart_item_grocery_options cio
                            JOIN grocery_option_values pov ON pov.id = cio.option_value_id
                            WHERE cio.cart_item_id = ci.id
                        ) o) as options
                FROM cart_item_grocery ci
                JOIN grocery_products p ON p.id = ci.product_id
                WHERE ci.cart_id = $1
            `, [cart.id]);
            cart.groceryItems = items;
        } else if (storeType === "PHARMACY") {
            items = await tenantQuery(storeId, `
                SELECT ci.*, 
                       row_to_json(p.*) as product
                FROM cart_item_pharmacy ci
                JOIN pharmacy_products p ON p.id = ci.product_id
                WHERE ci.cart_id = $1
            `, [cart.id]);
            cart.pharmacyItems = items;
        } else {
            items = await tenantQuery(storeId, `
                SELECT ci.*, 
                       row_to_json(p.*) as product,
                       (SELECT COALESCE(json_agg(row_to_json(o.*)), '[]'::json)
                        FROM (
                            SELECT cio.*, row_to_json(pov.*) as option_value 
                            FROM cart_item_options cio
                            JOIN product_option_values pov ON pov.id = cio.option_value_id
                            WHERE cio.cart_item_id = ci.id
                        ) o) as options
                FROM cart_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.cart_id = $1
            `, [cart.id]);
            cart.items = items;
        }

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

        const updatedItem = await tenantTransaction(storeId, async (client) => {
            const { rows } = await client.query(`
                INSERT INTO cart_items (cart_id, product_id, quantity, base_price)
                VALUES ($1, $2, $3, $4)
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
                        `, [cartItem.id, optId, ov.extra_price]);
                    }
                }
            }

            const { rows: finalRows } = await client.query(`
                SELECT ci.*, 
                       row_to_json(p.*) as product,
                       (SELECT COALESCE(json_agg(row_to_json(o.*)), '[]'::json) 
                        FROM (
                            SELECT cio.*, row_to_json(pov.*) as option_value 
                            FROM cart_item_options cio
                            JOIN product_option_values pov ON pov.id = cio.option_value_id
                            WHERE cio.cart_item_id = ci.id
                        ) o) as options
                FROM cart_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.id = $1
            `, [cartItem.id]);

            return finalRows[0];
        });

        res.status(201).json(new ApiResponse(201, updatedItem, "Item added to cart."));
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
        const { quantity, itemType, storeId } = req.body;

        if (!quantity || quantity < 1) throw new ApiError(400, "Quantity must be at least 1.");
        if (!itemType || !storeId) throw new ApiError(400, "itemType and storeId are required.");

        const tableMap = {
            restaurant: "cart_item_products",
            pharmacy: "cart_item_pharmacy",
            grocery: "cart_item_grocery",
            universal: "cart_items",
        };
        const table = tableMap[itemType] || "cart_items";
        if (!table) throw new ApiError(400, "Invalid itemType.");

        const [existing] = await tenantQuery(storeId, `SELECT id FROM ${table} WHERE id = $1`, [itemId]);
        if (!existing) throw new ApiError(404, "Cart item not found.");

        const [updated] = await tenantQuery(storeId, `
            UPDATE ${table} SET quantity = $1 WHERE id = $2 RETURNING *
        `, [quantity, itemId]);

        res.json(new ApiResponse(200, updated, "Quantity updated."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// REMOVE ITEM
// ═══════════════════════════════════════════════════════════════

export const removeItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { itemType, storeId } = req.query;

        if (!itemType || !storeId) throw new ApiError(400, "itemType and storeId query params are required.");

        const tableMap = {
            restaurant: "cart_item_products",
            pharmacy: "cart_item_pharmacy",
            grocery: "cart_item_grocery",
            universal: "cart_items",
        };
        const table = tableMap[itemType] || "cart_items";
        if (!table) throw new ApiError(400, "Invalid itemType.");

        await tenantQuery(storeId, `DELETE FROM ${table} WHERE id = $1`, [itemId]);

        res.json(new ApiResponse(200, null, "Item removed from cart."));
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
