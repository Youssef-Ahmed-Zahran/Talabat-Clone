import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Layers } from "lucide-react";
import {
  sectionSchema,
  type SectionFormValues,
} from "../../../../schemas/catalog.schema";
import type { Section } from "../../../../types";
import { SlideOver } from "../../../../components/layout/SlideOver";

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SectionFormValues) => void;
  isPending: boolean;
  editingSection: Section | null;
}

export function SectionModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  editingSection,
}: SectionModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    values: editingSection ? { name: editingSection.name } : { name: "" },
  });

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingSection ? "Edit Menu Category" : "New Menu Category"}
      description="Menu categories (like 'Burgers' or 'Desserts') help organize your products."
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-60"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingSection ? "Save Changes" : "Create Category"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl flex items-start gap-3">
          <Layers className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <p className="text-[12px] text-brand/80 leading-relaxed font-medium">
            Category names are visible to customers. Keep them short and
            descriptive to make browsing easier.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-bold text-gray-700 ml-1">
            Category Name *
          </label>
          <input
            type="text"
            {...register("name")}
            placeholder="e.g. Appetizers"
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-medium`}
            autoFocus
          />
          {errors.name && (
            <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>
    </SlideOver>
  );
}
