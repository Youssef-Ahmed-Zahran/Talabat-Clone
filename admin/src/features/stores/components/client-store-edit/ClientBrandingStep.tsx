import { Image as ImageIcon, Upload } from "lucide-react";
import { useClientStoreEditForm } from "../../hooks/useClientStoreEditForm";

type ClientStoreEditState = ReturnType<typeof useClientStoreEditForm>["state"];

interface ClientBrandingStepProps {
  state: ClientStoreEditState;
}

export function ClientBrandingStep({ state }: ClientBrandingStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        Branding
      </h3>
      <div className="relative h-48 w-full border-2 border-dashed border-gray-200 rounded-3xl overflow-visible group pb-8">
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="client-edit-cover-upload"
            onChange={(e) => state.handleFileChange(e, "coverImage")}
          />
          <label
            htmlFor="client-edit-cover-upload"
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all"
          >
            {state.coverImage ? (
              <img
                src={state.coverImage}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1 group-hover:text-brand transition-colors" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Select Cover Image
                </span>
              </div>
            )}
          </label>
        </div>

        <div className="absolute -bottom-10 left-8 z-10">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="client-edit-logo-upload"
            onChange={(e) => state.handleFileChange(e, "logoUrl")}
          />
          <label
            htmlFor="client-edit-logo-upload"
            className="block relative w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform overflow-hidden"
          >
            {state.logoUrl ? (
              <img
                src={state.logoUrl}
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <Upload className="w-5 h-5 text-gray-300" />
                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">
                  Logo
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
              <Upload className="w-4 h-4 text-white" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
