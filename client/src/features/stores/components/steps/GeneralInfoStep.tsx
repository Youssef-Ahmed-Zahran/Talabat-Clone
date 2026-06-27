import { useFormContext } from "react-hook-form";
import type { StoreFormValues } from "../../../../schemas/store.schema";
import type { Category } from "../../../../types";

interface GeneralInfoStepProps {
  categories?: Category[];
}

export function GeneralInfoStep({ categories }: GeneralInfoStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<StoreFormValues>();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Store Name *
          </label>
          <input
            {...register("name")}
            placeholder="e.g. Buffalo Burger"
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all`}
          />
          {errors.name && (
            <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Legal Entity Name
          </label>
          <input
            {...register("legalName")}
            placeholder="e.g. Buffalo Foods LLC"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Phone
            </label>
            <input
              {...register("phone")}
              placeholder="+201..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
              Email
            </label>
            <input
              {...register("email")}
              placeholder="store@email.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Category *
          </label>
          <select
            {...register("mainCategoryId")}
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.mainCategoryId ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all appearance-none`}
          >
            <option value="">Select category...</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Store Type *
          </label>
          <input
            {...register("storeType")}
            placeholder="e.g. RESTAURANT"
            className={`w-full px-4 py-3 bg-gray-50 border ${errors.storeType ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all`}
          />
        </div>
      </div>
    </div>
  );
}
