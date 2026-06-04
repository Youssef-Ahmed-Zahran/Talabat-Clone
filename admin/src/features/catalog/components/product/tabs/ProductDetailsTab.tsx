import { useFormContext, useFormState } from "react-hook-form";
import type { ProductFormValues } from "../../../../../schemas/catalog.schema";
import type { Section } from "../../../../../types";
import { ProductImagesUploader } from "./ProductImagesUploader";

interface ProductDetailsTabProps {
  sections?: Section[];
}

export function ProductDetailsTab({ sections }: ProductDetailsTabProps) {
  const { register, control } = useFormContext<ProductFormValues>();
  const { errors } = useFormState({ control });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Product Name *
          </label>
          <input
            {...register("name")}
            placeholder="e.g. Double Beef Burger"
            className={`w-full px-4 py-3 bg-gray-50 border ${
              errors.name ? "border-red-500" : "border-gray-100"
            } rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all font-medium`}
          />
          {errors.name && (
            <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Tell customers more about this item..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Price (EGP) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-brand"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Inventory Qty
            </label>
            <input
              type="number"
              {...register("quantity", {
                setValueAs: (v) => (v === "" ? "" : Number(v)),
              })}
              placeholder="Unlimited"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Menu Category
          </label>
          <select
            {...register("sectionId")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl appearance-none"
          >
            <option value="">Ungrouped</option>
            {sections?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <ProductImagesUploader />
      </div>
    </div>
  );
}
