import { useClearTimeout } from "../../../../hooks/useClearTimeout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  optionGroupSchema,
  type OptionGroupFormValues,
} from "../../../../schemas/productOption.schema";
import type { OptionGroup } from "../../../../types";

interface OptionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OptionGroupFormValues) => void;
  isPending: boolean;
  editingGroup: OptionGroup | null;
}

export function OptionGroupModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  editingGroup,
}: OptionGroupModalProps) {
  useClearTimeout(onClose, isOpen);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OptionGroupFormValues>({
    resolver: zodResolver(optionGroupSchema),
    values: editingGroup
      ? {
          name: editingGroup.name,
          isRequired: editingGroup.is_required || false,
          minSelect: editingGroup.min_select || 0,
          maxSelect: editingGroup.max_select || 1,
        }
      : { name: "", isRequired: false, minSelect: 0, maxSelect: 1 },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingGroup ? "Edit Option Group" : "Create Option Group"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Size, Toppings, Sauce..."
              className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.name ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("isRequired")}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <span className="text-sm text-gray-700">Required selection</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Min Select
              </label>
              <input
                type="number"
                {...register("minSelect", { valueAsNumber: true })}
                min="0"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Max Select
              </label>
              <input
                type="number"
                {...register("maxSelect", { valueAsNumber: true })}
                min="1"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>
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
              {editingGroup ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
