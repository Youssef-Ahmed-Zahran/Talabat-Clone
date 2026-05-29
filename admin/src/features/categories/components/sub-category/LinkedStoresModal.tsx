import { useClearTimeout } from "../../../../hooks/useClearTimeout";
import { X, Loader2, Store as StoreIcon, Trash2 } from "lucide-react";

import toast from "react-hot-toast";
import { useStoresInSubCategory, useUnlinkStore } from "../../api/category.api";
import type { Store } from "../../../../types";

interface LinkedStoresModalProps {
  subCategoryId: string;
  onClose: () => void;
}

export default function LinkedStoresModal({
  subCategoryId,
  onClose,
}: LinkedStoresModalProps) {
  const { data: linkedStoresData, isLoading } =
    useStoresInSubCategory(subCategoryId);
  const unlinkStoreMutation = useUnlinkStore();

  useClearTimeout(onClose);

  const handleUnlink = (storeId: string) => {
    if (
      window.confirm(
        "Are you sure you want to unlink this store from this sub-category?",
      )
    ) {
      unlinkStoreMutation.mutate(
        { subCategoryId, storeId },
        {
          onSuccess: () => toast.success("Store unlinked successfully"),
          onError: () => toast.error("Failed to unlink store"),
        },
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-lg p-6 animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Linked Stores</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
            </div>
          ) : linkedStoresData?.stores?.length > 0 ? (
            <div className="space-y-3">
              {linkedStoresData.stores.map((store: Store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
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
                      <p className="text-sm font-semibold text-gray-900">
                        {store.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {store.storeType}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlink(String(store.id))}
                    disabled={unlinkStoreMutation.isPending}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Unlink Store"
                  >
                    {unlinkStoreMutation.isPending &&
                    unlinkStoreMutation.variables?.storeId === store.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-gray-500">
              No stores linked to this sub-category yet.
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
