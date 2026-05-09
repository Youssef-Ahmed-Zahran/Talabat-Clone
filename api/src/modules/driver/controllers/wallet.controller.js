import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

// ═══════════════════════════════════════════════════════════════
// HELPER: Get or create wallet for a driver
// ═══════════════════════════════════════════════════════════════

export const ensureWallet = async (driverId) => {
    let wallet = await prisma.driverWallet.findUnique({ where: { driverId } });
    if (!wallet) {
        wallet = await prisma.driverWallet.create({ data: { driverId } });
    }
    return wallet;
};

// ═══════════════════════════════════════════════════════════════
// GET PLATFORM WALLET  (Admin)
// GET /api/admin/platform/wallet
// ═══════════════════════════════════════════════════════════════

export const getPlatformWallet = async (req, res, next) => {
    try {
        const wallet = await ensurePlatformWallet();

        const transactions = await prisma.platformWalletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        res.json(new ApiResponse(200, {
            wallet,
            recentTransactions: transactions,
        }, "Platform wallet fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET STORE WALLET  (Owner)
// GET /api/owner/wallet
// ═══════════════════════════════════════════════════════════════

export const getStoreWallet = async (req, res, next) => {
    try {
        const storeId = req.owner.storeId;
        const wallet = await ensureStoreWallet(storeId);

        const transactions = await prisma.storeWalletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        res.json(new ApiResponse(200, {
            wallet,
            recentTransactions: transactions,
        }, "Store wallet fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET USER WALLET  (Customer)
// GET /api/user/wallet
// ═══════════════════════════════════════════════════════════════

export const getMyUserWallet = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const wallet = await ensureUserWallet(userId);

        const transactions = await prisma.userWalletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        res.json(new ApiResponse(200, {
            wallet,
            recentTransactions: transactions,
        }, "User wallet fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET MY WALLET  (Driver)
// GET /api/driver/wallet
// ═══════════════════════════════════════════════════════════════

export const getMyWallet = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const wallet = await ensureWallet(driverId);

        const recentTransactions = await prisma.driverWalletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const isSuspended = Number(wallet.balance) <= -Number(wallet.creditLimit);

        res.json(new ApiResponse(200, {
            wallet,
            isSuspended,
            recentTransactions,
        }, "Wallet fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET WALLET TRANSACTIONS  (Driver)
// GET /api/driver/wallet/transactions?page=1&limit=20&type=
// ═══════════════════════════════════════════════════════════════

export const getMyTransactions = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { type, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const wallet = await ensureWallet(driverId);
        const where = { walletId: wallet.id };
        if (type) where.type = type;

        const [transactions, total] = await Promise.all([
            prisma.driverWalletTransaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit),
            }),
            prisma.driverWalletTransaction.count({ where }),
        ]);

        res.json(new ApiResponse(200, {
            transactions,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Transactions fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: GET DRIVER WALLET
// GET /api/admin/drivers/:driverId/wallet
// ═══════════════════════════════════════════════════════════════

export const getDriverWalletByAdmin = async (req, res, next) => {
    try {
        const { driverId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const wallet = await ensureWallet(driverId);

        const [transactions, total] = await Promise.all([
            prisma.driverWalletTransaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit),
            }),
            prisma.driverWalletTransaction.count({ where: { walletId: wallet.id } }),
        ]);

        const isSuspended = Number(wallet.balance) <= -Number(wallet.creditLimit);

        res.json(new ApiResponse(200, {
            wallet,
            isSuspended,
            transactions,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Driver wallet fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: TOP-UP (clear debt after driver deposits cash)
// POST /api/admin/drivers/:driverId/wallet/topup
// Body: { amount: number, note?: string }
// ═══════════════════════════════════════════════════════════════

export const adminTopUp = async (req, res, next) => {
    try {
        const { driverId } = req.params;
        const { amount, note } = req.body;

        if (!amount || Number(amount) <= 0) {
            throw new ApiError(400, "Amount must be a positive number.");
        }

        const wallet = await ensureWallet(driverId);
        const credit = Number(amount);
        const newBalance = Number(wallet.balance) + credit;

        const [updatedWallet, transaction] = await prisma.$transaction([
            prisma.driverWallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance },
            }),
            prisma.driverWalletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: "ADMIN_TOP_UP",
                    status: "COMPLETED",
                    amount: credit,
                    balanceAfter: newBalance,
                    note: note || `Admin top-up of EGP ${credit}`,
                },
            }),
        ]);

        // If balance is back above the suspension threshold, re-enable driver
        if (Number(wallet.balance) <= -Number(wallet.creditLimit) && newBalance > -Number(wallet.creditLimit)) {
            await prisma.driver.update({
                where: { id: driverId },
                data: { status: "OFFLINE" }, // restore to offline so they can go online manually
            });
        }

        res.json(new ApiResponse(200, { wallet: updatedWallet, transaction }, "Wallet topped up successfully."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: MANUAL DEBIT
// POST /api/admin/drivers/:driverId/wallet/debit
// Body: { amount: number, note?: string }
// ═══════════════════════════════════════════════════════════════

export const adminDebit = async (req, res, next) => {
    try {
        const { driverId } = req.params;
        const { amount, note } = req.body;

        if (!amount || Number(amount) <= 0) {
            throw new ApiError(400, "Amount must be a positive number.");
        }

        const wallet = await ensureWallet(driverId);
        const debit = -Math.abs(Number(amount));
        const newBalance = Number(wallet.balance) + debit;

        const [updatedWallet, transaction] = await prisma.$transaction([
            prisma.driverWallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance },
            }),
            prisma.driverWalletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: "ADMIN_DEBIT",
                    status: "COMPLETED",
                    amount: debit,
                    balanceAfter: newBalance,
                    note: note || `Admin manual debit of EGP ${Math.abs(debit)}`,
                },
            }),
        ]);

        // Auto-suspend if exceeds credit limit
        if (newBalance <= -Number(wallet.creditLimit)) {
            await prisma.driver.update({
                where: { id: driverId },
                data: { status: "SUSPENDED", isOnline: false },
            });
        }

        res.json(new ApiResponse(200, { wallet: updatedWallet, transaction }, "Wallet debited."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: UPDATE CREDIT LIMIT
// PATCH /api/admin/drivers/:driverId/wallet/credit-limit
// Body: { creditLimit: number }
// ═══════════════════════════════════════════════════════════════

export const updateCreditLimit = async (req, res, next) => {
    try {
        const { driverId } = req.params;
        const { creditLimit } = req.body;

        if (creditLimit === undefined || Number(creditLimit) < 0) {
            throw new ApiError(400, "creditLimit must be a non-negative number.");
        }

        const wallet = await ensureWallet(driverId);

        const updated = await prisma.driverWallet.update({
            where: { id: wallet.id },
            data: { creditLimit: Number(creditLimit) },
        });

        res.json(new ApiResponse(200, updated, "Credit limit updated."));
    } catch (err) {
        next(err);
    }
};
// ═══════════════════════════════════════════════════════════════
// HELPERS: Ensure Wallets exist
// ═══════════════════════════════════════════════════════════════

export const ensureStoreWallet = async (storeId, tx) => {
    const prismaClient = tx || prisma;
    let wallet = await prismaClient.storeWallet.findUnique({ where: { storeId } });
    if (!wallet) {
        wallet = await prismaClient.storeWallet.create({ data: { storeId } });
    }
    return wallet;
};

export const ensureUserWallet = async (userId, tx) => {
    const prismaClient = tx || prisma;
    let wallet = await prismaClient.userWallet.findUnique({ where: { userId } });
    if (!wallet) {
        wallet = await prismaClient.userWallet.create({ data: { userId } });
    }
    return wallet;
};

export const getUserWallet = async (userId) => {
    return await prisma.userWallet.findUnique({ where: { userId } });
};

export const ensurePlatformWallet = async (tx) => {
    const prismaClient = tx || prisma;
    let wallet = await prismaClient.platformWallet.findUnique({ where: { name: "TALABAT_MAIN" } });
    if (!wallet) {
        wallet = await prismaClient.platformWallet.create({ data: { name: "TALABAT_MAIN" } });
    }
    return wallet;
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL: Handle Wallet Logic on Order Delivery
// ═══════════════════════════════════════════════════════════════

export const handleWalletOnDelivery = async (orderId, tx) => {
    const prismaClient = tx || prisma;

    // 1. Fetch order details with all necessary relations
    const order = await prismaClient.order.findUnique({
        where: { id: orderId },
        include: {
            driverAssign: true,
            paymentMethod: true,
            store: true,
        },
    });

    if (!order) {
        console.warn(`[Wallet] Order ${orderId} not found.`);
        return;
    }

    const { subtotal, deliveryFees, tipAmount, appFee, storeEarnings, totalAmount, paymentMethod, store, driverAssign } = order;
    
    // Amounts as numbers
    const numSubtotal = Number(subtotal);
    const numDeliveryFees = Number(deliveryFees);
    const numTip = Number(tipAmount);
    const numAppFee = Number(appFee); // This is the Platform Commission
    const numStoreEarnings = Number(storeEarnings);
    const numTotal = Number(totalAmount);
    
    const isCash = paymentMethod.name === "CASH";

    // ─── A. DRIVER WALLET ───────────────────────────────────────────
    if (driverAssign?.driverId) {
        const driverId = driverAssign.driverId;
        const dWallet = await ensureWallet(driverId, prismaClient);
        const driverEarning = numDeliveryFees + numTip;
        let dBalance = Number(dWallet.balance);

        if (isCash) {
            // Driver collected full cash. Debit them the whole amount (liability).
            dBalance -= numTotal;
            await prismaClient.driverWalletTransaction.create({
                data: {
                    walletId: dWallet.id, orderId, type: "CASH_ORDER_DEBIT",
                    amount: -numTotal, balanceAfter: dBalance,
                    note: `Cash collected for order #${orderId.slice(0, 8)}. Total: ${numTotal}`,
                },
            });
        }

        // Credit earnings
        dBalance += driverEarning;
        await prismaClient.driverWalletTransaction.create({
            data: {
                walletId: dWallet.id, orderId, type: "DELIVERY_FEE_CREDIT",
                amount: driverEarning, balanceAfter: dBalance,
                note: `Earnings for order #${orderId.slice(0, 8)}. Delivery: ${numDeliveryFees}, Tip: ${numTip}`,
            },
        });

        await prismaClient.driverWallet.update({ where: { id: dWallet.id }, data: { balance: dBalance } });
        await prismaClient.driverEarning.upsert({
            where: { orderId },
            update: { 
                baseAmount: numDeliveryFees,
                tipAmount: numTip,
                totalAmount: driverEarning 
            },
            create: { 
                driverId, 
                orderId, 
                baseAmount: numDeliveryFees,
                tipAmount: numTip,
                totalAmount: driverEarning 
            }
        });

        // Auto-suspend check
        if (dBalance <= -Number(dWallet.creditLimit)) {
            await prismaClient.driver.update({ where: { id: driverId }, data: { status: "SUSPENDED", isOnline: false } });
        }
    }

    // ─── B. STORE WALLET ────────────────────────────────────────────
    const sWallet = await ensureStoreWallet(store.id, prismaClient);
    let sBalance = Number(sWallet.balance);
    
    // Store always gets their earnings (net of commission)
    sBalance += numStoreEarnings;
    await prismaClient.storeWalletTransaction.create({
        data: {
            walletId: sWallet.id, orderId, type: "ORDER_EARNING",
            amount: numStoreEarnings, balanceAfter: sBalance,
            note: `Earnings for order #${orderId.slice(0, 8)}. Subtotal: ${numSubtotal}, Net: ${numStoreEarnings}`,
        },
    });
    await prismaClient.storeWallet.update({ where: { id: sWallet.id }, data: { balance: sBalance } });

    // ─── C. PLATFORM WALLET ─────────────────────────────────────────
    const pWallet = await ensurePlatformWallet(prismaClient);
    let pBalance = Number(pWallet.balance);
    
    // Platform gets the App Fee (Commission)
    pBalance += numAppFee;
    await prismaClient.platformWalletTransaction.create({
        data: {
            walletId: pWallet.id, orderId, type: "COMMISSION",
            amount: numAppFee, balanceAfter: pBalance,
            note: `Commission from order #${orderId.slice(0, 8)}. Store: ${store.name}`,
        },
    });
    await prismaClient.platformWallet.update({ where: { id: pWallet.id }, data: { balance: pBalance } });

    console.log(`[Wallet] Distribution Complete for #${orderId.slice(0, 8)}: Platform +${numAppFee}, Store +${numStoreEarnings}`);
};

