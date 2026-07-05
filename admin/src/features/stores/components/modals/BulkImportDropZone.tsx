import { useRef, useState, useCallback } from "react";
import { Upload, X, FileSpreadsheet } from "lucide-react";

import type { DropZoneProps } from "../../../../types";

export function DropZone({ file, onFile, onClear, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files[0];
      if (dropped?.name.endsWith(".xlsx")) onFile(dropped);
    },
    [disabled, onFile],
  );

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 bg-brand/5 border border-brand/20 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-400">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        {!disabled && (
          <button
            onClick={onClear}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer
        transition-all duration-200 select-none
        ${isDragging ? "border-brand bg-brand/5 scale-[1.01]" : "border-gray-200 hover:border-brand/50 hover:bg-gray-50/80"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        disabled={disabled}
      />
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-brand/15" : "bg-gray-100"}`}
      >
        <Upload
          className={`w-6 h-6 transition-colors ${isDragging ? "text-brand" : "text-gray-400"}`}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">
          {isDragging ? "Drop it here!" : "Drag & drop your Excel file"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          or <span className="text-brand font-semibold">click to browse</span> ·
          .xlsx only · max 15 MB
        </p>
      </div>
    </div>
  );
}
