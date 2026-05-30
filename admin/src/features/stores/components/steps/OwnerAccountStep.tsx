import { useFormContext } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import type { StoreFormValues } from "../../../../schemas/store.schema";

interface OwnerAccountStepProps {
  isEditing: boolean;
}

export function OwnerAccountStep({ isEditing }: OwnerAccountStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<StoreFormValues>();

  if (isEditing) return null;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="p-5 bg-brand/5 border border-brand/10 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-brand" />
          <h3 className="text-sm font-bold text-brand">Secure Owner Portal</h3>
        </div>
        <p className="text-[12px] text-gray-600 leading-relaxed">
          Set the initial login credentials for the store owner. They will use
          these to access their dedicated Partner Portal.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Owner Email *
          </label>
          <input
            {...register("ownerEmail")}
            type="email"
            placeholder="owner@example.com"
            className={`w-full px-4 py-3 bg-white border ${errors.ownerEmail ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all`}
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Initial Password *
          </label>
          <input
            {...register("ownerPassword")}
            type="text"
            placeholder="At least 6 characters"
            className={`w-full px-4 py-3 bg-white border ${errors.ownerPassword ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all`}
          />
        </div>
      </div>
    </div>
  );
}
