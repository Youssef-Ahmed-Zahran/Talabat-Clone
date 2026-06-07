import prisma from "../../../config/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

// ═══════════════════════════════════════════════════════════════
// HELPER: Get or create wallet for a driver
// ═══════════════════════════════════════════════════════════════

export const ensureWallet = async (driverId, tx) => {
    const prismaClient = tx || prisma;
    let wallet = await prismaClient.driverWallet.findUnique({ where: { driverId } });
    if (!wallet) {
        wallet = await prismaClient.driverWallet.create({ data: { driverId } });
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

// ═══════════════════════════════════════════════════════════════
// DRIVER: SUBMIT DEBT REPAYMENT REQUEST
// POST /api/drivers/wallet/repay
// Body: { amount, method, referenceNumber?, note? }
// ═══════════════════════════════════════════════════════════════

export const submitDebtPayment = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { amount, method, referenceNumber, note } = req.body;

        if (!amount || Number(amount) <= 0) {
            throw new ApiError(400, "Amount must be a positive number.");
        }

        if (!method || !["CREDIT_CARD", "VODAFONE_CASH", "INSTAPAY"].includes(method)) {
            throw new ApiError(400, "Method must be one of: CREDIT_CARD, VODAFONE_CASH, INSTAPAY.");
        }

        const wallet = await ensureWallet(driverId);
        const currentBalance = Number(wallet.balance);

        if (currentBalance >= 0) {
            throw new ApiError(400, "You have no outstanding debt to pay.");
        }

        const maxRepayable = Math.abs(currentBalance);
        const repayAmount = Number(amount);

        if (repayAmount > maxRepayable) {
            throw new ApiError(400, `Amount exceeds your current debt of EGP ${maxRepayable.toFixed(2)}.`);
        }

        // Check for existing PENDING payment to prevent duplicates
        const existingPending = await prisma.driverDebtPayment.findFirst({
            where: { driverId, status: "PENDING" },
        });
        if (existingPending) {
            throw new ApiError(409, "You already have a pending payment request. Please wait for it to be confirmed.");
        }

        // CREDIT CARD: simulated — auto-confirm immediately
        if (method === "CREDIT_CARD") {
            const payment = await prisma.$transaction(async (tx) => {
                // 1. Create the payment record
                const debtPayment = await tx.driverDebtPayment.create({
                    data: {
                        driverId,
                        amount: repayAmount,
                        method: "CREDIT_CARD",
                        status: "CONFIRMED",
                        note: note || "Credit card payment (simulated)",
                        confirmedAt: new Date(),
                    },
                });

                // 2. Update driver wallet
                const newDriverBalance = currentBalance + repayAmount;
                await tx.driverWallet.update({
                    where: { id: wallet.id },
                    data: { balance: newDriverBalance },
                });
                await tx.driverWalletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: "DEBT_REPAYMENT",
                        status: "COMPLETED",
                        amount: repayAmount,
                        balanceAfter: newDriverBalance,
                        note: `Debt repayment via Credit Card. Ref: ${debtPayment.id.slice(0, 8)}`,
                    },
                });

                // 3. Update platform wallet (Talabat receives the cash)
                const pWallet = await ensurePlatformWallet(tx);
                const newPlatformBalance = Number(pWallet.balance) + repayAmount;
                await tx.platformWallet.update({
                    where: { id: pWallet.id },
                    data: { balance: newPlatformBalance },
                });
                await tx.platformWalletTransaction.create({
                    data: {
                        walletId: pWallet.id,
                        type: "DRIVER_CASH_SETTLEMENT",
                        amount: repayAmount,
                        balanceAfter: newPlatformBalance,
                        note: `Cash settlement from driver ${driverId.slice(0, 8)} via Credit Card`,
                    },
                });

                // 4. Restore driver status if they were suspended due to debt
                if (newDriverBalance > -Number(wallet.creditLimit)) {
                    const driver = await tx.driver.findUnique({ where: { id: driverId } });
                    if (driver?.status === "SUSPENDED") {
                        await tx.driver.update({
                            where: { id: driverId },
                            data: { status: "OFFLINE" },
                        });
                    }
                }

                return debtPayment;
            });

            return res.json(new ApiResponse(200, {
                payment,
                message: "Payment confirmed. Your wallet balance has been updated.",
            }, "Debt repayment successful."));
        }

        // VODAFONE_CASH / INSTAPAY: create PENDING — requires admin confirmation
        const payment = await prisma.driverDebtPayment.create({
            data: {
                driverId,
                amount: repayAmount,
                method,
                status: "PENDING",
                referenceNumber: referenceNumber || null,
                note: note || null,
            },
        });

        res.status(201).json(new ApiResponse(201, {
            payment,
            message: "Your payment request has been submitted and is awaiting admin confirmation.",
        }, "Debt repayment request submitted."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// DRIVER: GET MY DEBT PAYMENT HISTORY
// GET /api/drivers/wallet/payments
// ═══════════════════════════════════════════════════════════════

export const getMyDebtPayments = async (req, res, next) => {
    try {
        const driverId = req.driver.id;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [payments, total] = await Promise.all([
            prisma.driverDebtPayment.findMany({
                where: { driverId },
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit),
            }),
            prisma.driverDebtPayment.count({ where: { driverId } }),
        ]);

        res.json(new ApiResponse(200, {
            payments,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Payment history fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: LIST ALL PENDING DEBT PAYMENTS
// GET /api/admin/drivers/debt-payments?status=PENDING
// ═══════════════════════════════════════════════════════════════

export const listDebtPayments = async (req, res, next) => {
    try {
        const { status = "PENDING", page = 1, limit = 20, driverId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = {};
        if (status && status !== "ALL") where.status = status;
        if (driverId) where.driverId = driverId;

        const [payments, total] = await Promise.all([
            prisma.driverDebtPayment.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit),
                include: {
                    driver: {
                        select: {
                            id: true,
                            email: true,
                            phone: true,
                            application: {
                                select: { firstName: true, familyName: true },
                            },
                        },
                    },
                },
            }),
            prisma.driverDebtPayment.count({ where }),
        ]);

        res.json(new ApiResponse(200, {
            payments,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Debt payments fetched."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL: Settle driver debt — updates both wallets atomically
// ═══════════════════════════════════════════════════════════════

const settleDriverDebt = async (paymentId, tx) => {
    const prismaClient = tx || prisma;

    const payment = await prismaClient.driverDebtPayment.findUnique({
        where: { id: paymentId },
    });
    if (!payment) throw new ApiError(404, "Payment record not found.");
    if (payment.status !== "PENDING") throw new ApiError(400, "Payment is not in PENDING state.");

    const repayAmount = Number(payment.amount);
    const dWallet = await ensureWallet(payment.driverId, prismaClient);
    const currentBalance = Number(dWallet.balance);
    const newDriverBalance = currentBalance + repayAmount;

    // 1. Confirm the payment record
    await prismaClient.driverDebtPayment.update({
        where: { id: paymentId },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    // 2. Update driver wallet
    await prismaClient.driverWallet.update({
        where: { id: dWallet.id },
        data: { balance: newDriverBalance },
    });
    await prismaClient.driverWalletTransaction.create({
        data: {
            walletId: dWallet.id,
            type: "DEBT_REPAYMENT",
            status: "COMPLETED",
            amount: repayAmount,
            balanceAfter: newDriverBalance,
            note: `Debt repayment via ${payment.method}. Ref: ${payment.referenceNumber || payment.id.slice(0, 8)}`,
        },
    });

    // 3. Update platform wallet
    const pWallet = await ensurePlatformWallet(prismaClient);
    const newPlatformBalance = Number(pWallet.balance) + repayAmount;
    await prismaClient.platformWallet.update({
        where: { id: pWallet.id },
        data: { balance: newPlatformBalance },
    });
    await prismaClient.platformWalletTransaction.create({
        data: {
            walletId: pWallet.id,
            type: "DRIVER_CASH_SETTLEMENT",
            amount: repayAmount,
            balanceAfter: newPlatformBalance,
            note: `Cash settlement from driver ${payment.driverId.slice(0, 8)} via ${payment.method}`,
        },
    });

    // 4. Restore driver if previously suspended for debt
    if (newDriverBalance > -Number(dWallet.creditLimit)) {
        const driver = await prismaClient.driver.findUnique({ where: { id: payment.driverId } });
        if (driver?.status === "SUSPENDED") {
            await prismaClient.driver.update({
                where: { id: payment.driverId },
                data: { status: "OFFLINE" },
            });
        }
    }

    return { payment, newDriverBalance, newPlatformBalance };
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: CONFIRM A DEBT PAYMENT (VF Cash / InstaPay)
// POST /api/admin/drivers/debt-payments/:paymentId/confirm
// ═══════════════════════════════════════════════════════════════

export const confirmDebtPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const result = await prisma.$transaction(async (tx) => {
            return settleDriverDebt(paymentId, tx);
        });

        res.json(new ApiResponse(200, result, "Payment confirmed and wallets updated."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: REJECT A DEBT PAYMENT
// POST /api/admin/drivers/debt-payments/:paymentId/reject
// Body: { rejectionReason }
// ═══════════════════════════════════════════════════════════════

export const rejectDebtPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const { rejectionReason } = req.body;

        const payment = await prisma.driverDebtPayment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new ApiError(404, "Payment record not found.");
        if (payment.status !== "PENDING") throw new ApiError(400, "Payment is not in PENDING state.");

        const updated = await prisma.driverDebtPayment.update({
            where: { id: paymentId },
            data: {
                status: "REJECTED",
                rejectedAt: new Date(),
                rejectionReason: rejectionReason || "Payment could not be verified.",
            },
        });

        res.json(new ApiResponse(200, updated, "Payment rejected."));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: PROCESS MONTHLY STORE PAYOUT
// POST /api/admin/stores/:storeId/payout
// Body: { transactionRef?, note? }
// — Pays the store owner their accumulated wallet balance
// — Platform Wallet is debited, Store Wallet is cleared
// ═══════════════════════════════════════════════════════════════

export const processMonthlyStorePayout = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const { transactionRef, note } = req.body;

        const sWallet = await ensureStoreWallet(storeId);
        const storeBalance = Number(sWallet.balance);

        if (storeBalance <= 0) {
            throw new ApiError(400, "Store has no earnings to pay out.");
        }

        const pWallet = await ensurePlatformWallet();
        const platformBalance = Number(pWallet.balance);

        if (platformBalance < storeBalance) {
            throw new ApiError(400, `Platform wallet has insufficient funds (EGP ${platformBalance.toFixed(2)}) to cover payout of EGP ${storeBalance.toFixed(2)}.`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create withdrawal record
            const withdrawal = await tx.storeWithdrawal.create({
                data: {
                    storeId,
                    amount: storeBalance,
                    status: "COMPLETED",
                    transactionRef: transactionRef || null,
                    note: note || `Monthly payout for store ${storeId.slice(0, 8)}`,
                    processedAt: new Date(),
                    completedAt: new Date(),
                },
            });

            // 2. Debit store wallet (balance → 0)
            const newStoreBalance = 0;
            await tx.storeWallet.update({
                where: { id: sWallet.id },
                data: { balance: newStoreBalance },
            });
            await tx.storeWalletTransaction.create({
                data: {
                    walletId: sWallet.id,
                    type: "WITHDRAWAL",
                    amount: -storeBalance,
                    balanceAfter: newStoreBalance,
                    note: `Monthly payout processed. Withdrawal ID: ${withdrawal.id.slice(0, 8)}`,
                },
            });

            // 3. Debit platform wallet (Talabat pays the store)
            const newPlatformBalance = platformBalance - storeBalance;
            await tx.platformWallet.update({
                where: { id: pWallet.id },
                data: { balance: newPlatformBalance },
            });
            await tx.platformWalletTransaction.create({
                data: {
                    walletId: pWallet.id,
                    type: "STORE_PAYOUT",
                    amount: -storeBalance,
                    balanceAfter: newPlatformBalance,
                    note: `Monthly payout to store ${storeId.slice(0, 8)}. Amount: EGP ${storeBalance.toFixed(2)}`,
                },
            });

            return { withdrawal, newStoreBalance, newPlatformBalance };
        });

        res.json(new ApiResponse(200, result, `Store payout of EGP ${storeBalance.toFixed(2)} processed successfully.`));
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN: GET STORE WITHDRAWAL HISTORY
// GET /api/admin/stores/:storeId/withdrawals
// ═══════════════════════════════════════════════════════════════

export const getStoreWithdrawals = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [withdrawals, total] = await Promise.all([
            prisma.storeWithdrawal.findMany({
                where: { storeId },
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit),
            }),
            prisma.storeWithdrawal.count({ where: { storeId } }),
        ]);

        res.json(new ApiResponse(200, {
            withdrawals,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        }, "Withdrawal history fetched."));
    } catch (err) {
        next(err);
    }
};


