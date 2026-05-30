import { useClearTimeout } from "../../../../hooks/useClearTimeout";
import { Loader2 } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  linkStoreSchema,
  type LinkStoreFormValues,
} from "../../../../schemas/subCategory.schema";
import { useStores } from "../../../stores/api/store.api";

interface LinkStoreModalProps {
  onClose: () => void;
  onSubmit: (data: LinkStoreFormValues) => void;
  isPending: boolean;
}

export default function LinkStoreModal({
  onClose,
  onSubmit,
  isPending,
}: LinkStoreModalProps) {
  const { data: storesResponse, isLoading: isLoadingStores } = useStores();
  const stores = storesResponse?.stores || [];

  useClearTimeout(onClose);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkStoreFormValues>({
    resolver: zodResolver(linkStoreSchema),
    defaultValues: { storeId: "" },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Link Store</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <label
              htmlFor="store-select"
              className="block text-[13px] font-medium text-gray-700 mb-1.5"
            >
              Select Store
            </label>
            <div className="relative">
              <select
                id="store-select"
                disabled={isLoadingStores}
                {...register("storeId", { required: "Please select a store" })}
                className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.storeId ? "border-red-500" : "border-gray-200"} rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all appearance-none`}
              >
                <option value="">
                  {isLoadingStores ? "Loading stores…" : "Choose a store…"}
                </option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {isLoadingStores && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {errors.storeId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.storeId.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
