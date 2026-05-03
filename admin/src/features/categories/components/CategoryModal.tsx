import { useClearTimeout } from "../../../hooks/useClearTimeout";
import { Loader2, Upload } from "lucide-react";

import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  categorySchema,
  type CategoryFormValues,
} from "../../../schemas/category.schema";
import { useCreateCategory, useUpdateCategory } from "../api/category.api";
import type { Category } from "../../../types";

interface CategoryModalProps {
  editingCategory: Category | null;
  onClose: () => void;
}

export default function CategoryModal({
  editingCategory,
  onClose,
}: CategoryModalProps) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  useClearTimeout(onClose);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: {
      name: editingCategory?.name || "",
      image: editingCategory?.imageUrl || editingCategory?.image || "",
    },
  });

  const watchImage = watch("image");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setValue("image", reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate(
        {
          categoryId: editingCategory.id,
          name: data.name.trim(),
          image: data.image || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Category updated");
            onClose();
          },
          onError: () => toast.error("Failed to update category"),
        },
      );
    } else {
      createMutation.mutate(
        { name: data.name.trim(), image: data.image || undefined },
        {
          onSuccess: () => {
            toast.success("Category created");
            onClose();
          },
          onError: () => toast.error("Failed to create category"),
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingCategory ? "Edit Category" : "Create Category"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <label
              htmlFor="category-name"
              className="block text-[13px] font-medium text-gray-700 mb-1.5"
            >
              Category Name *
            </label>
            <input
              id="category-name"
              type="text"
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Restaurants"
              className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.name ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all mb-4`}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 -mt-3 mb-3">
                {errors.name.message}
              </p>
            )}

            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Category Image
            </label>
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl hover:border-brand/50 hover:bg-brand/5 transition-colors cursor-pointer group relative overflow-hidden bg-gray-50/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {watchImage ? (
                <img
                  src={watchImage}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-brand mb-2" />
                  <span className="text-[12px] text-gray-500 font-medium">
                    Upload Image
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">
                    PNG, JPG up to 2MB
                  </span>
                </div>
              )}
            </label>
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
              {editingCategory ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
