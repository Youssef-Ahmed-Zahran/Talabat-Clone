import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  AlertCircle,
  History,
} from "lucide-react";
import { useDriverWalletManager } from "../../hooks/useDriverWalletManager";
import { DriverWalletModals } from "./DriverWalletModals";

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  note: string | null;
  createdAt: string;
}

interface DriverWalletDetailsProps {
  driverId: string;
}

export function DriverWalletDetails({ driverId }: DriverWalletDetailsProps) {
  const { query, modal, form, actions } = useDriverWalletManager(driverId);

  if (query.isLoading)
    return (
      <div className="animate-pulse bg-white rounded-3xl h-64 shadow-sm border border-gray-100" />
    );
  if (query.isError || !query.data) return null;

  const { wallet, isSuspended, transactions } = query.data;

  const balance = Number(wallet.balance);
  const creditLimit = Number(wallet.creditLimit);

  return (
    <div className="space-y-8">
      {/* Wallet Card */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="absolute top-0 right-0 p-8">
          <div
            className={`p-3 rounded-2xl ${isSuspended ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}
          >
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Current Balance
            </p>
            <h2
              className={`text-4xl font-bold tracking-tight ${balance < 0 ? "text-red-600" : "text-gray-900"}`}
            >
              EGP {balance.toLocaleString()}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <Settings className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Credit Limit
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  EGP {creditLimit.toLocaleString()}
                </p>
              </div>
            </div>

            {isSuspended && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100">
                <AlertCircle className="w-4 h-4" />
                ACCOUNT SUSPENDED (Debt exceeded limit)
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={modal.openTopUp}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              <ArrowUpRight className="w-4 h-4" />
              Collect Cash
            </button>
            <button
              onClick={modal.openDebit}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all border border-red-100"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Manual Debit
            </button>
            <button
              onClick={modal.openLimit}
              className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">Wallet Transactions</h3>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm italic">
                No transactions yet.
              </p>
            </div>
          ) : (
            transactions.map((tx: Transaction) => (
              <div
                key={tx.id}
                className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-xl ${Number(tx.amount) > 0 ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}
                  >
                    {Number(tx.amount) > 0 ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {tx.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {tx.note || "No description"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${Number(tx.amount) > 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {Number(tx.amount) > 0 ? "+" : ""}
                    {Number(tx.amount).toLocaleString()} EGP
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }).format(new Date(tx.createdAt))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DriverWalletModals
        modal={modal}
        form={form}
        actions={actions}
        creditLimit={creditLimit}
      />
    </div>
  );
}
