import { useClearTimeout } from "../../../../hooks/useClearTimeout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  optionValueSchema,
  type OptionValueFormValues,
} from "../../../../schemas/productOption.schema";
import type { OptionValue } from "../../../../types";
import { SlideOver } from "../../../../components/layout/SlideOver";

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

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingValue ? "Edit Option Value" : "Add Option Value"}
      description="Configure option value and its extra price."
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="option-value-form"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingValue ? "Update" : "Add"}
          </button>
        </div>
      }
    >
      <form
        id="option-value-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
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
      </form>
    </SlideOver>
  );
}
