import { Loader2, Upload, LayoutGrid } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  subCategorySchema,
  type SubCategoryFormValues,
} from "../../../../schemas/subCategory.schema";
import type { Category } from "../../../../types";
import { SlideOver } from "../../../../components/layout/SlideOver";

interface SubCategoryModalProps {
  isOpen: boolean;
  editingSub: Category | null;
  onClose: () => void;
  onSubmit: (data: SubCategoryFormValues) => void;
  isPending: boolean;
}

export default function SubCategoryModal({
  isOpen,
  editingSub,
  onClose,
  onSubmit,
  isPending,
}: SubCategoryModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategorySchema),
    defaultValues: {
      name: editingSub?.name || "",
      image: editingSub?.imageUrl || editingSub?.image || "",
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

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingSub ? "Edit Sub-Category" : "New Sub-Category"}
      description="Sub-categories help narrow down choices for customers within a main category."
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
            {editingSub ? "Save Changes" : "Create Sub-Category"}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
          <LayoutGrid className="w-5 h-5 text-gray-400 mt-0.5" />
          <p className="text-[12px] text-gray-500 leading-relaxed">
            For example, under 'Restaurants', you might have 'Burgers', 'Pizza',
            or 'Sushi'.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Sub-Category Name *
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Burgers"
              className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-medium`}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Visual Icon/Image
            </label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-3xl hover:bg-gray-50 transition-all cursor-pointer group relative overflow-hidden bg-gray-50/30">
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
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-brand transition-colors" />
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Upload Sub-Category Image
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
