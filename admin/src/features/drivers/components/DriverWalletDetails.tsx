import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Settings, 
  AlertCircle,
  History
} from "lucide-react";
import { 
  useDriverWallet, 
  useTopUpWallet, 
  useDebitWallet, 
  useUpdateCreditLimit 
} from "../api/driver.api";
import { useState } from "react";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  note: string | null;
  createdAt: string;
}

interface WalletData {
  wallet: {
    id: string;
    balance: number | string;
    creditLimit: number | string;
  };
  isSuspended: boolean;
  transactions: Transaction[];
}

interface DriverWalletDetailsProps {
  driverId: string;
}

export function DriverWalletDetails({ driverId }: DriverWalletDetailsProps) {
  const { data, isLoading, isError } = useDriverWallet(driverId) as { 
    data: WalletData | undefined, 
    isLoading: boolean, 
    isError: boolean 
  };
  const topUpMutation = useTopUpWallet(driverId);
  const debitMutation = useDebitWallet(driverId);
  const updateLimitMutation = useUpdateCreditLimit(driverId);

  const [showTopUp, setShowTopUp] = useState(false);
  const [showDebit, setShowDebit] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [limit, setLimit] = useState("");

  if (isLoading) return <div className="animate-pulse bg-white rounded-3xl h-64 shadow-sm border border-gray-100" />;
  if (isError || !data) return null;

  const { wallet, isSuspended, transactions } = data;

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return toast.error("Invalid amount");
    
    topUpMutation.mutate({ 
      driverId, 
      amount: Number(amount), 
      note 
    }, {
      onSuccess: () => {
        toast.success("Wallet topped up successfully");
        setShowTopUp(false);
        setAmount("");
        setNote("");
      },
      onError: () => toast.error("Failed to top up wallet")
    });
  };

  const handleDebit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return toast.error("Invalid amount");
    
    debitMutation.mutate({ 
      driverId, 
      amount: Number(amount), 
      note 
    }, {
      onSuccess: () => {
        toast.success("Wallet debited successfully");
        setShowDebit(false);
        setAmount("");
        setNote("");
      },
      onError: () => toast.error("Failed to debit wallet")
    });
  };

  const handleUpdateLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(Number(limit))) return toast.error("Invalid limit");
    
    updateLimitMutation.mutate({ 
      driverId, 
      creditLimit: Number(limit) 
    }, {
      onSuccess: () => {
        toast.success("Credit limit updated");
        setShowLimit(false);
        setLimit("");
      },
      onError: () => toast.error("Failed to update credit limit")
    });
  };

  const balance = Number(wallet.balance);
  const creditLimit = Number(wallet.creditLimit);

  return (
    <div className="space-y-8">
      {/* Wallet Card */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="absolute top-0 right-0 p-8">
          <div className={`p-3 rounded-2xl ${isSuspended ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Current Balance</p>
            <h2 className={`text-4xl font-bold tracking-tight ${balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              EGP {balance.toLocaleString()}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                <Settings className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Credit Limit</p>
                <p className="text-sm font-semibold text-gray-700">EGP {creditLimit.toLocaleString()}</p>
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
              onClick={() => setShowTopUp(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              <ArrowUpRight className="w-4 h-4" />
              Collect Cash
            </button>
            <button 
              onClick={() => setShowDebit(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all border border-red-100"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Manual Debit
            </button>
            <button 
              onClick={() => setShowLimit(true)}
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
              <p className="text-gray-400 text-sm italic">No transactions yet.</p>
            </div>
          ) : (
            transactions.map((tx: Transaction) => (
              <div key={tx.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${Number(tx.amount) > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                    {Number(tx.amount) > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500 font-medium">{tx.note || 'No description'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${Number(tx.amount) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()} EGP
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }).format(new Date(tx.createdAt))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Top-up Wallet (Cash Collection)</h3>
            <form onSubmit={handleTopUp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount (EGP)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note (Optional)</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Collected via Vodafone Cash"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium h-24 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTopUp(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={topUpMutation.isPending}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                >
                  Confirm Top-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debit Modal */}
      {showDebit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Manual Debit (Adjustment)</h3>
            <form onSubmit={handleDebit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Debit Amount (EGP)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason for Debit</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Late delivery penalty"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium h-24 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowDebit(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={debitMutation.isPending}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                >
                  Confirm Debit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {showLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Update Credit Limit</h3>
            <form onSubmit={handleUpdateLimit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Limit (EGP)</label>
                <input 
                  type="number" 
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder={`Current: ${creditLimit}`}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                />
                <p className="mt-2 text-[10px] text-gray-400">The driver will be suspended if their negative balance exceeds this amount.</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowLimit(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateLimitMutation.isPending}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
