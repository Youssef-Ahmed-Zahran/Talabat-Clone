-- Add new enum values
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'DEBT_REPAYMENT';

-- Create DebtPaymentMethod enum
DO $$ BEGIN
    CREATE TYPE "DebtPaymentMethod" AS ENUM ('CREDIT_CARD', 'VODAFONE_CASH', 'INSTAPAY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create DebtPaymentStatus enum
DO $$ BEGIN
    CREATE TYPE "DebtPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create WithdrawalStatus enum
DO $$ BEGIN
    CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create driver_debt_payments table
CREATE TABLE IF NOT EXISTS "driver_debt_payments" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" "DebtPaymentMethod" NOT NULL,
    "status" "DebtPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "referenceNumber" TEXT,
    "receiptUrl" TEXT,
    "note" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_debt_payments_pkey" PRIMARY KEY ("id")
);

-- Create indexes for driver_debt_payments
CREATE INDEX IF NOT EXISTS "driver_debt_payments_driverId_idx" ON "driver_debt_payments"("driverId");
CREATE INDEX IF NOT EXISTS "driver_debt_payments_status_idx" ON "driver_debt_payments"("status");
CREATE INDEX IF NOT EXISTS "driver_debt_payments_createdAt_idx" ON "driver_debt_payments"("createdAt");

-- Add foreign key for driver_debt_payments
ALTER TABLE "driver_debt_payments"
    ADD CONSTRAINT "driver_debt_payments_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create store_withdrawals table
CREATE TABLE IF NOT EXISTS "store_withdrawals" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "transactionRef" TEXT,
    "note" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_withdrawals_pkey" PRIMARY KEY ("id")
);

-- Create indexes for store_withdrawals
CREATE INDEX IF NOT EXISTS "store_withdrawals_storeId_idx" ON "store_withdrawals"("storeId");
CREATE INDEX IF NOT EXISTS "store_withdrawals_status_idx" ON "store_withdrawals"("status");
CREATE INDEX IF NOT EXISTS "store_withdrawals_createdAt_idx" ON "store_withdrawals"("createdAt");

-- Add foreign key for store_withdrawals
ALTER TABLE "store_withdrawals"
    ADD CONSTRAINT "store_withdrawals_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
