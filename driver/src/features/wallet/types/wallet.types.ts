export interface DriverWallet {
  id: string;
  driverId: string;
  balance: string; // Decimal comes as string from API
  creditLimit: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  orderId?: string;
  type:
    | "CASH_ORDER_DEBIT"
    | "DELIVERY_FEE_CREDIT"
    | "ADMIN_TOP_UP"
    | "ADMIN_DEBIT"
    | "PAYOUT"
    | "DEBT_REPAYMENT";
  status: "PENDING" | "COMPLETED" | "REVERSED";
  amount: string;
  balanceAfter: string;
  note?: string;
  createdAt: string;
}

export type DebtPaymentMethod = "CREDIT_CARD" | "VODAFONE_CASH" | "INSTAPAY";
export type DebtPaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface DebtPayment {
  id: string;
  driverId: string;
  amount: string;
  method: DebtPaymentMethod;
  status: DebtPaymentStatus;
  referenceNumber?: string;
  receiptUrl?: string;
  note?: string;
  confirmedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletData {
  wallet: DriverWallet;
  isSuspended: boolean;
  recentTransactions: WalletTransaction[];
}

export interface RepayDebtPayload {
  amount: number;
  method: DebtPaymentMethod;
  referenceNumber?: string;
  note?: string;
}

export const PAYMENT_METHOD_LABELS: Record<DebtPaymentMethod, string> = {
  CREDIT_CARD: "Credit Card",
  VODAFONE_CASH: "Vodafone Cash",
  INSTAPAY: "InstaPay",
};

export const PAYMENT_METHOD_ICONS: Record<DebtPaymentMethod, string> = {
  CREDIT_CARD: "card-outline",
  VODAFONE_CASH: "phone-portrait-outline",
  INSTAPAY: "flash-outline",
};

// Talabat's collection numbers — driver sends money here
export const TALABAT_PAYMENT_NUMBERS: Record<"VODAFONE_CASH" | "INSTAPAY", string> = {
  VODAFONE_CASH: "01001234567",
  INSTAPAY: "talabat@instapay",
};
