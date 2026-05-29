import { useClearTimeout } from "../../../../hooks/useClearTimeout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  optionValueSchema,
  type OptionValueFormValues,
} from "../../../../schemas/productOption.schema";
import type { OptionValue } from "../../../../types";

interface OptionValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OptionValueFormValues) => void;
  isPending: boolean;
  editingValue: OptionValue | null;
}

export function OptionValueModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  editingValue,
}: OptionValueModalProps) {
  useClearTimeout(onClose, isOpen);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OptionValueFormValues>({
    resolver: zodResolver(optionValueSchema),
    values: editingValue
      ? { name: editingValue.name, extraPrice: editingValue.extra_price || 0 }
      : { name: "", extraPrice: 0 },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-sm p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingValue ? "Edit Option Value" : "Add Option Value"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Value Name *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Small, Medium, Large..."
              className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.name ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Extra Price (EGP)
            </label>
            <input
              type="number"
              {...register("extraPrice", { valueAsNumber: true })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
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
              {editingValue ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
