import { useFormContext } from "react-hook-form";
import { Upload, Image as ImageIcon } from "lucide-react";
import type { StoreFormValues } from "../../../../schemas/store.schema";

export function BrandingStep() {
  const { watch, setValue } = useFormContext<StoreFormValues>();

  const logoUrl = watch("logoUrl");
  const coverImage = watch("coverImage");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "logoUrl" | "coverImage",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setValue(fieldName, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="relative">
        <label className="block text-[13px] font-bold text-gray-700 mb-3 ml-1">
          Store Branding
        </label>
        <div className="relative h-48 w-full border-2 border-dashed border-gray-200 rounded-3xl overflow-visible group pb-8">
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="cover-upload"
              onChange={(e) => handleFileChange(e, "coverImage")}
            />
            <label
              htmlFor="cover-upload"
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all"
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover"
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
              id="logo-upload"
              onChange={(e) => handleFileChange(e, "logoUrl")}
            />
            <label
              htmlFor="logo-upload"
              className="block relative w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-xl cursor-pointer hover:scale-105 transition-transform overflow-hidden"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
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
        <p className="mt-14 text-[11px] text-gray-400 font-medium px-1">
          Upload your store's brand identity. Click the banner to set a cover,
          and the logo card to set an icon.
        </p>
      </div>
    </div>
  );
}
