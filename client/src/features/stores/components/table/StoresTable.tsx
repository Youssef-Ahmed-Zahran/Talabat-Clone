import { Store as StoreIcon, Power, Pencil, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Store } from "../../../../types";
import PageLoader from "../../../../components/loader/PageLoader";

interface StoresTableProps {
  stores?: Store[];
  onToggleStatus: (storeId: number | string, e: React.MouseEvent) => void;
  onEdit: (store: Store, e: React.MouseEvent) => void;
  isToggling: boolean;
  isLoading?: boolean;
}

export function StoresTable({
  stores,
  onToggleStatus,
  onEdit,
  isToggling,
  isLoading,
}: StoresTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-gray-100/80 premium-shadow overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/30">
            <th className="text-left px-6 py-4.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Store
            </th>
            <th className="text-left px-6 py-4.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Category
            </th>
            <th className="text-left px-6 py-4.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Status
            </th>
            <th className="text-left px-6 py-4.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Rating
            </th>
            <th className="text-right px-6 py-4.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="py-20">
                <PageLoader />
              </td>
            </tr>
          ) : stores && stores.length > 0 ? (
            stores.map((store) => (
              <tr
                key={store.id}
                onClick={() => navigate(`/stores/${store.id}`)}
                className="hover:bg-gray-50/50 transition-all duration-200 cursor-pointer group"
              >
                <td className="px-6 py-4.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <StoreIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                        {store.name}
                      </p>
                      {store.phone && (
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {store.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4.5 text-sm text-gray-500 font-semibold">
                  {store.mainCategory?.name || "—"}
                </td>
                <td className="px-6 py-4.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                      store.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100/60"
                        : "bg-red-50 text-red-600 border-red-100/60"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${store.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    {store.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4.5">
                  {store.averageRating ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-xl">
                      ★ {Number(store.averageRating).toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4.5 text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={(e) => onToggleStatus(store.id, e)}
                      disabled={isToggling}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all active:scale-95 ${
                        store.isActive
                          ? "text-red-600 bg-red-50 border-red-100/50 hover:bg-red-100/80"
                          : "text-emerald-600 bg-emerald-50 border-emerald-100/50 hover:bg-emerald-100/80"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {store.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={(e) => onEdit(store, e)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100/50 rounded-xl transition-all active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-16 text-center text-sm font-medium text-gray-400"
              >
                No stores found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
