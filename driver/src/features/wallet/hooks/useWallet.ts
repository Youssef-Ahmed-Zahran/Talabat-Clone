// Re-export from the API layer for backward compatibility and clean naming.
// Use these hooks in screens and other hooks.
export {
  useWalletDetailsQuery as useWalletDetails,
  useWalletTransactionsQuery as useWalletTransactions,
  useWalletPaymentsQuery as useWalletPayments,
} from "../api/wallet.api";

