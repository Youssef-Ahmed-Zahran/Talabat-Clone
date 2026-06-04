import { useClearTimeout } from "../../../../hooks/useClearTimeout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  optionGroupSchema,
  type OptionGroupFormValues,
} from "../../../../schemas/productOption.schema";
import type { OptionGroup } from "../../../../types";
import { SlideOver } from "../../../../components/layout/SlideOver";

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

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingGroup ? "Edit Option Group" : "Create Option Group"}
      description="Configure options and selection rules for this group."
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
            form="option-group-form"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingGroup ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form
        id="option-group-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
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
      </form>
    </SlideOver>
  );
}
