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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-50 bg-gray-50/50">
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Store
            </th>
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Category
            </th>
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Status
            </th>
            <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Rating
            </th>
            <th className="text-right px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
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
                className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
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
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand transition-colors">
                        {store.name}
                      </p>
                      {store.phone && (
                        <p className="text-[12px] text-gray-400">
                          {store.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {store.mainCategory?.name || "—"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      store.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {store.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700 font-medium">
                    {store.averageRating
                      ? `${Number(store.averageRating).toFixed(1)} ★`
                      : "—"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={(e) => onToggleStatus(store.id, e)}
                      disabled={isToggling}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors ${
                        store.isActive
                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                          : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {store.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={(e) => onEdit(store, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors" />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-16 text-center text-sm text-gray-400"
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
