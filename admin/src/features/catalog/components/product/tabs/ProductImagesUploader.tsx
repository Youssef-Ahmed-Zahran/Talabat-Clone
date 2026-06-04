import { useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { ImagePlus, X, Star } from "lucide-react";
import type { ProductFormValues } from "../../../../../schemas/catalog.schema";

export function ProductImagesUploader() {
  const { setValue, control } = useFormContext<ProductFormValues>();
  const images = useWatch({ control, name: "images" }) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((newImages) => {
      const updated = [...images, ...newImages];
      setValue("images", updated);
      setValue("primaryImage", updated[0] ?? undefined);
    });
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setValue("images", updated);
    setValue("primaryImage", updated[0] ?? undefined);
  };

  const handleSetPrimary = (index: number) => {
    const reordered = [images[index], ...images.filter((_, i) => i !== index)];
    setValue("images", reordered);
    setValue("primaryImage", reordered[0]);
  };

  return (
    <div>
      <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
        Product Images
      </label>

      <div className="grid grid-cols-3 gap-3">
        {/* Uploaded image thumbnails */}
        {images.map((src, index) => (
          <div
            key={index}
            className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50"
          >
            <img
              src={src}
              alt={`Product image ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Primary badge */}
            {index === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-white" /> Primary
              </span>
            )}

            {/* Hover actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(index)}
                  className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  title="Set as primary"
                >
                  <Star className="w-3.5 h-3.5 text-brand" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100/60 hover:border-brand/30 transition-all flex flex-col items-center justify-center gap-1.5 group"
        >
          <ImagePlus className="w-6 h-6 text-gray-300 group-hover:text-brand transition-colors" />
          <span className="text-[11px] text-gray-400 font-semibold group-hover:text-brand transition-colors">
            Add Image
          </span>
        </button>
      </div>

      {images.length > 0 && (
        <p className="text-[11px] text-gray-400 mt-2 ml-1">
          ★ First image is the primary. Hover to reorder or remove.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
