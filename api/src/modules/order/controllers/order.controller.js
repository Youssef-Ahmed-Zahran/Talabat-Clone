import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { tenantQuery, tenantTransaction } from "../../../lib/tenantDb.js";
import { getIO } from "../../../config/socket.js";
import { dispatchToNearestDriver } from "../../../sockets/dispatch.socket.js";

// ═══════════════════════════════════════════════════════════════
// HELPER: Fetch Cart Items from Tenant Schema
// ═══════════════════════════════════════════════════════════════

const fetchCartItems = async (cartId, storeId) => {
    return await tenantQuery(storeId, `
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
    `, [cartId]);
};

// ═══════════════════════════════════════════════════════════════
// PLACE ORDER
// ═══════════════════════════════════════════════════════════════

export const placeOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { storeId, addressId, paymentMethodId, tipAmount, deliveryInstructions, scheduledTime } = req.body;

        if (!storeId || !addressId || !paymentMethodId) {
            throw new ApiError(400, "storeId, addressId, and paymentMethodId are required.");
        }

        const address = await prisma.userAddress.findFirst({ where: { id: addressId, userId } });
        if (!address) throw new ApiError(404, "Address not found.");

        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store || !store.isActive) throw new ApiError(404, "Store not found or inactive.");

        const cart = await prisma.cart.findUnique({ where: { userId_storeId: { userId, storeId } } });
        if (!cart) throw new ApiError(400, "Cart is empty.");

        const cartItems = await fetchCartItems(cart.id, storeId);
        if (cartItems.length === 0) throw new ApiError(400, "Cart is empty.");

        let subtotal = 0;
        for (const item of cartItems) {
            let itemTotal = Number(item.base_price) * item.quantity;
            if (item.options) {
                for (const opt of item.options) {
                    itemTotal += Number(opt.extra_price) * item.quantity;
                }
            }
            subtotal += itemTotal;
        }

        if (store.minimumOrderCost && subtotal < Number(store.minimumOrderCost)) {
            throw new ApiError(400, `Minimum order is ${store.minimumOrderCost}.`);
        }

        const deliveryFees = Number(store.deliveryFees || 0);
        const tip = Number(tipAmount || 0);
        const totalAmount = subtotal + deliveryFees + tip;

        // ── Create the order WITHOUT auto-assigning a driver ──────────────
        // The driver dispatch happens asynchronously after the transaction.
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    paymentMethodId,
                    subtotal,
                    deliveryFees,
                    tipAmount: tip,
                    totalAmount,
                    deliveryType: store.deliveryType,
                    deliveryInstructions: deliveryInstructions || null,
                    scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
                },
            });

            await tx.orderStatusHistory.create({
                data: { orderId: newOrder.id, status: "PENDING", changedByType: "SYSTEM" },
            });

            await tx.payment.create({
                data: { orderId: newOrder.id, status: "PENDING" },
            });

            // Create LiveTracking in WAITING_FOR_DRIVER state
            // Driver will be assigned after they accept the dispatch
            await tx.liveTracking.create({
                data: { orderId: newOrder.id, status: "WAITING_FOR_DRIVER" },
            });

            await tx.cart.delete({ where: { id: cart.id } });
            return newOrder;
        });

        // Save items to tenant schema using raw SQL
        await tenantTransaction(storeId, async (client) => {
            for (const item of cartItems) {
                const { rows } = await client.query(`
                    INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, quantity, meta_snapshot)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
                `, [order.id, item.product_id, item.product.name, item.base_price, item.quantity, item.product.meta || {}]);

                if (item.options) {
                    for (const opt of item.options) {
                        await client.query(`
                            INSERT INTO order_item_options (order_item_id, option_value_id, option_name_snapshot, option_value_snapshot, extra_price_snapshot)
                            VALUES ($1, $2, $3, $4, $5)
                        `, [rows[0].id, opt.option_value_id, opt.option_value.name, opt.option_value.name, opt.extra_price]);
                    }
                }
            }
        });

        // ── Dispatch to nearest driver (async — don't block the response) ──
        // This runs in the background after the response is sent
        const io = getIO();
        setImmediate(async () => {
            try {
                await dispatchToNearestDriver(io, order.id, store, address);
            } catch (err) {
                console.error("[PlaceOrder] Dispatch error (non-blocking):", err);
            }
        });

        // ── Notify Store Owner & Admins ──
        try {
            const { emitToAdmins, emitToOwner } = await import("../../../sockets/notifications.socket.js");
            
            // 1. Broadcast to all admins (Real-time only)
            emitToAdmins(io, {
                title: "New Order! 🚀",
                body: `A new order (#${order.id}) was just placed at ${store.name}!`,
                type: "ORDER_UPDATE",
                meta: { orderId: order.id, storeId: store.id }
            });

            // 2. Persist notification for the specific Store Owner
            const owner = await prisma.ownerAccount.findFirst({
                where: { storeId: store.id, isActive: true }
            });

            if (owner) {
                await emitToOwner(io, owner.id, {
                    title: "New Order Received! 🍕",
                    body: `Order #${order.id} is waiting for preparation.`,
                    type: "ORDER_UPDATE",
                    relatedOrderId: order.id,
                    meta: { orderId: order.id }
                });
            }
        } catch (err) {
            console.error("[PlaceOrder] Notification error:", err);
        }

        const fullOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                store: true, address: true, paymentMethod: true,
                payment: true, liveTracking: true, driverAssign: true,
            },
        });

        // Attach tenant items to the response for convenience
        res.status(201).json(new ApiResponse(201, { ...fullOrder, items: cartItems }, "Order placed successfully. Looking for a driver..."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET MY ORDERS
// ═══════════════════════════════════════════════════════════════

export const getMyOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = { userId };
        if (status) where.status = status;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: { store: { select: { id: true, name: true, logoUrl: true, storeType: true } } },
            }),
            prisma.order.count({ where }),
        ]);

        res.json(new ApiResponse(200, {
            orders,
            pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        }, "Orders fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET ORDER BY ID
// ═══════════════════════════════════════════════════════════════

export const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const order = await prisma.order.findFirst({
            where: { id, userId },
            include: {
                store: { select: { id: true, name: true, logoUrl: true, storeType: true } },
                address: { include: { city: { include: { country: { select: { name: true } } } } } },
                paymentMethod: true, statusHistory: { orderBy: { createdAt: "asc" } },
                payment: true, liveTracking: true, delivery: { include: { driver: { select: { id: true, email: true, phone: true } } } }, review: true,
            },
        });

        if (!order) throw new ApiError(404, "Order not found.");

        let items = await tenantQuery(order.store.id, `
            SELECT oi.*, 
                   (SELECT COALESCE(json_agg(row_to_json(o.*)), '[]'::json) FROM order_item_options o WHERE o.order_item_id = oi.id) as options
            FROM order_items oi WHERE oi.order_id = $1
        `, [order.id]);

        res.json(new ApiResponse(200, { ...order, items }, "Order fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// CANCEL ORDER
// ═══════════════════════════════════════════════════════════════

export const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;

        const order = await prisma.order.findFirst({
            where: { id, userId },
            include: {
                driverAssign: { select: { driverId: true, status: true } },
            },
        });
        if (!order) throw new ApiError(404, "Order not found.");

        // ── Cancel policy: only PENDING or CONFIRMED ──────────────────────
        // Once the store starts PREPARING, nobody can cancel.
        const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];
        if (!CANCELLABLE_STATUSES.includes(order.status)) {
            throw new ApiError(
                400,
                "This order cannot be cancelled because the store has already started preparing it."
            );
        }

        await prisma.$transaction(async (tx) => {
            // 1. Cancel the order
            await tx.order.update({
                where: { id },
                data: { status: "CANCELLED", cancellationReason: reason || null, cancelledAt: new Date() },
            });

            // 2. Status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status: "CANCELLED",
                    changedByType: "USER",
                    changedByUserId: userId,
                    note: reason || "Cancelled by user",
                },
            });

            // 3. Update live tracking
            await tx.liveTracking.updateMany({
                where: { orderId: id },
                data: { status: "DELIVERED" }, // Terminal state
            });

            // 4. If a driver was assigned (PENDING or ACCEPTED), release them
            if (order.driverAssign?.driverId) {
                await tx.orderDriverAssignment.update({
                    where: { orderId: id },
                    data: { status: "CANCELLED" },
                });

                // Set driver back to ONLINE so they can receive new orders
                await tx.driver.update({
                    where: { id: order.driverAssign.driverId },
                    data: { status: "ONLINE" },
                });
            }
        });

        res.json(new ApiResponse(200, null, "Order cancelled."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// REORDER
// ═══════════════════════════════════════════════════════════════

export const reorder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const order = await prisma.order.findFirst({
            where: { id, userId },
            include: { store: true },
        });

        if (!order) throw new ApiError(404, "Order not found.");

        let cart = await prisma.cart.findUnique({ where: { userId_storeId: { userId, storeId: order.storeId } } });
        if (!cart) cart = await prisma.cart.create({ data: { userId, storeId: order.storeId } });

        const storeType = order.store.storeType;
        const storeId = order.storeId;

        await tenantTransaction(storeId, async (client) => {
            const { rows: items } = await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
            for (const item of items) {
                if (!item.product_id) continue;
                const { rows: cRows } = await client.query(`
                    INSERT INTO cart_items (cart_id, product_id, quantity, base_price)
                    VALUES ($1, $2, $3, $4) RETURNING id
                `, [cart.id, item.product_id, item.quantity, item.price_snapshot]);

                const { rows: opts } = await client.query(`SELECT * FROM order_item_options WHERE order_item_id = $1`, [item.id]);
                for (const opt of opts) {
                    if (!opt.option_value_id) continue;
                    await client.query(`
                        INSERT INTO cart_item_options (cart_item_id, option_value_id, extra_price)
                        VALUES ($1, $2, $3)
                    `, [cRows[0].id, opt.option_value_id, opt.extra_price_snapshot]);
                }
            }
        });

        res.json(new ApiResponse(200, { cartId: cart.id, storeId: order.storeId }, "Items added to cart for reorder."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET STORE ORDERS (Owner)
// ═══════════════════════════════════════════════════════════════

export const getStoreOrders = async (req, res, next) => {
    try {
        const storeId = req.owner.storeId;
        const { status, search, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = { storeId };
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: "insensitive" } },
                { user: { fullName: { contains: search, mode: "insensitive" } } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: "desc" },
                include: { 
                    user: { select: { id: true, fullName: true, phone: true } }, 
                    store: { select: { id: true, name: true, storeType: true } },
                    address: true, 
                    payment: true,
                    delivery: {
                        select: {
                            driverId: true,
                            driver: {
                                select: {
                                    id: true,
                                    phone: true,
                                    application: { select: { firstName: true, familyName: true } },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        res.json(new ApiResponse(200, { orders, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } }, "Store orders fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// UPDATE ORDER STATUS (Owner / Admin)
// ═══════════════════════════════════════════════════════════════

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;
        if (!status) throw new ApiError(400, "Status is required.");

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                store: { select: { name: true } },
                driverAssign: { select: { driverId: true } },
            },
        });
        if (!order) throw new ApiError(404, "Order not found.");

        // ── Cancel guard: once PREPARING, only admin can cancel ───────────
        if (status === "CANCELLED") {
            const NON_CANCELLABLE = ["PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];
            // Owners cannot cancel once preparing; admins can force-cancel
            if (NON_CANCELLABLE.includes(order.status) && !req.admin) {
                throw new ApiError(400, "Cannot cancel — the store has already started preparing this order.");
            }
        }

        let changedByType = "SYSTEM";
        let changedByUserId = null;
        let changedByDriverId = null;
        let changedByAdminId = null;

        if (req.admin) { changedByType = "ADMIN"; changedByAdminId = req.admin.id; }
        if (req.owner) { changedByType = "SYSTEM"; } // Owner acts on behalf of store

        // Map order status → LiveTracking status
        const liveStatusMap = {
            CONFIRMED:        "DRIVER_HEADING_TO_STORE",
            PREPARING:        "DRIVER_HEADING_TO_STORE",
            READY_FOR_PICKUP: "DRIVER_AT_STORE",
            PICKED_UP:        "DRIVER_HEADING_TO_CUSTOMER",
            ON_THE_WAY:       "DRIVER_HEADING_TO_CUSTOMER",
            DELIVERED:        "DELIVERED",
        };
        const liveStatus = liveStatusMap[status] || null;

        await prisma.$transaction(async (tx) => {
            await tx.order.update({ where: { id }, data: { status } });
            await tx.orderStatusHistory.create({
                data: { orderId: id, status, changedByType, changedByAdminId, note: note || null },
            });

            // Update LiveTracking if mapped
            if (liveStatus) {
                await tx.liveTracking.updateMany({
                    where: { orderId: id },
                    data: { status: liveStatus },
                });
            }

            // If cancelling, release driver
            if (status === "CANCELLED" && order.driverAssign?.driverId) {
                await tx.orderDriverAssignment.update({
                    where: { orderId: id },
                    data: { status: "CANCELLED" },
                });
                await tx.driver.update({
                    where: { id: order.driverAssign.driverId },
                    data: { status: "ONLINE" },
                });
            }
        });

        // ── Real-time notifications ──────────────────────────────────────
        try {
            const io = getIO();

            // Broadcast status change to the tracking room
            io.of("/tracking").to(`order:${id}`).emit("tracking:status_changed", {
                orderId: id,
                status,
                liveStatus,
                changedAt: new Date(),
            });

            // Notify user
            const { emitToUser } = await import("../../../sockets/notifications.socket.js");
            const userNotifs = {
                PREPARING:        { title: "Being prepared 👨‍🍳", body: `${order.store.name} is preparing your order. Your driver is on the way to the restaurant.` },
                READY_FOR_PICKUP: { title: "Ready for pickup 📦", body: `Your order is ready! The driver is at ${order.store.name} picking it up.` },
                CANCELLED:        { title: "Order cancelled ❌", body: "Your order has been cancelled." },
            };
            if (userNotifs[status]) {
                await emitToUser(io, order.userId, {
                    ...userNotifs[status],
                    type: "ORDER_UPDATE",
                    relatedOrderId: id,
                });
            }

            // Notify driver when order is ready
            if (status === "READY_FOR_PICKUP" && order.driverAssign?.driverId) {
                const { emitToDriver } = await import("../../../sockets/notifications.socket.js");
                await emitToDriver(io, order.driverAssign.driverId, {
                    title: "Order ready for pickup 📦",
                    body: `Order from ${order.store.name} is ready. Pick it up now!`,
                    type: "ORDER_UPDATE",
                    relatedOrderId: id,
                });
            }
        } catch (socketErr) {
            console.error("[updateOrderStatus] Socket notification error (non-blocking):", socketErr);
        }

        res.json(new ApiResponse(200, { orderId: id, status }, "Order status updated."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET ALL ORDERS (Admin)
// ═══════════════════════════════════════════════════════════════

export const getOrdersByAdmin = async (req, res, next) => {
    try {
        const { status, storeId, userId, search, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = {};
        if (status) where.status = status;
        if (storeId) where.storeId = storeId;
        if (userId) where.userId = userId;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: "insensitive" } },
                { user: { fullName: { contains: search, mode: "insensitive" } } },
                { store: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    store: { select: { id: true, name: true, storeType: true } },
                    payment: { select: { status: true } },
                    delivery: {
                        select: {
                            driverId: true,
                            driver: {
                                select: {
                                    id: true,
                                    phone: true,
                                    application: { select: { firstName: true, familyName: true } },
                                },
                            },
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        res.json(new ApiResponse(200, { orders, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } }, "All orders fetched."));
    } catch (err) {
        next(err);
    }
};
