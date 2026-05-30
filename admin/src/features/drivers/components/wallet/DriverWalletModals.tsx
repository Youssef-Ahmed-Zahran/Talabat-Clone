import { useDriverWalletManager } from "../../hooks/useDriverWalletManager";

type WalletManagerState = ReturnType<typeof useDriverWalletManager>;

interface DriverWalletModalsProps {
  modal: WalletManagerState["modal"];
  form: WalletManagerState["form"];
  actions: WalletManagerState["actions"];
  creditLimit: number;
}

export function DriverWalletModals({
  modal,
  form,
  actions,
  creditLimit,
}: DriverWalletModalsProps) {
  if (!modal.state.type) return null;

  return (
    <>
      {/* Top-up Modal */}
      {modal.state.type === "TOP_UP" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Top-up Wallet (Cash Collection)
            </h3>
            <form onSubmit={actions.handleTopUp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Amount (EGP)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => form.setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => form.setNote(e.target.value)}
                  placeholder="e.g. Collected via Vodafone Cash"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium h-24 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={modal.close}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actions.isToppingUp}
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
      {modal.state.type === "DEBIT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Manual Debit (Adjustment)
            </h3>
            <form onSubmit={actions.handleDebit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Debit Amount (EGP)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => form.setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Reason for Debit
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => form.setNote(e.target.value)}
                  placeholder="e.g. Late delivery penalty"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium h-24 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={modal.close}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actions.isDebiting}
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
      {modal.state.type === "LIMIT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Update Credit Limit
            </h3>
            <form onSubmit={actions.handleUpdateLimit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  New Limit (EGP)
                </label>
                <input
                  type="number"
                  value={form.limit}
                  onChange={(e) => form.setLimit(e.target.value)}
                  placeholder={`Current: ${creditLimit}`}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                />
                <p className="mt-2 text-[10px] text-gray-400">
                  The driver will be suspended if their negative balance exceeds
                  this amount.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={modal.close}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actions.isUpdatingLimit}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
