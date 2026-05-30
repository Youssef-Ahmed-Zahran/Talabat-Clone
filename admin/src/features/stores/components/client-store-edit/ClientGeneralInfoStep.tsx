import { useClientStoreEditForm } from "../../hooks/useClientStoreEditForm";

type ClientStoreEditForm = ReturnType<typeof useClientStoreEditForm>["form"];

interface ClientGeneralInfoStepProps {
  form: ClientStoreEditForm;
}

export function ClientGeneralInfoStep({ form }: ClientGeneralInfoStepProps) {
  return (
    <div className="space-y-4 pt-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        General Info
      </h3>
      <div>
        <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
          Store Name
        </label>
        <input
          {...form.register("name")}
          className={`w-full px-4 py-3 bg-gray-50 border ${form.errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none`}
        />
      </div>

      <div>
        <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
          Description
        </label>
        <textarea
          {...form.register("description")}
          rows={2}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Phone
          </label>
          <input
            {...form.register("phone")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
            Email
          </label>
          <input
            {...form.register("email")}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none"
          />
        </div>
      </div>
    </div>
  );
}
