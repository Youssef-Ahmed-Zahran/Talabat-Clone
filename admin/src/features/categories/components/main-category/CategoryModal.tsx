import { Loader2, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  categorySchema,
  type CategoryFormValues,
} from "../../../../schemas/category.schema";
import type { Category } from "../../../../types";
import { SlideOver } from "../../../../components/layout/SlideOver";
import { ImageUploadField } from "./ImageUploadField";

interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => void;
  isPending: boolean;
}

export default function CategoryModal({
  isOpen,
  editingCategory,
  onClose,
  onSubmit,
  isPending,
}: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: {
      name: editingCategory?.name || "",
      image: editingCategory?.imageUrl || editingCategory?.image || "",
    },
  });

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? "Edit Category" : "Add Category"}
      description="Main categories define the top-level structure of the marketplace."
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
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-70"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingCategory ? "Save Changes" : "Create Category"}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
          <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Examples: Restaurants, Grocery, Pharmacy. This category will appear
            on the homepage.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Category Name *
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Restaurants"
              className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-medium`}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <ImageUploadField control={control} setValue={setValue} />
        </div>
      </div>
    </SlideOver>
  );
}
