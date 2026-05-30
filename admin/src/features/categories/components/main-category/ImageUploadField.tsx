import { Upload } from "lucide-react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import type { CategoryFormValues } from "../../../../schemas/category.schema";

interface ImageUploadFieldProps {
  control: Control<CategoryFormValues>;
  setValue: UseFormSetValue<CategoryFormValues>;
}

export function ImageUploadField({ control, setValue }: ImageUploadFieldProps) {
  const watchImage = useWatch({
    control,
    name: "image",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setValue("image", reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
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
              Upload Category Image
            </span>
          </div>
        )}
      </label>
    </div>
  );
}
