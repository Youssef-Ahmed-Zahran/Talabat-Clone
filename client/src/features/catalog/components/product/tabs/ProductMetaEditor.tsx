import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { ProductFormValues } from "../../../../../schemas/catalog.schema";

export function ProductMetaEditor() {
  const { control, setValue } = useFormContext<ProductFormValues>();
  const currentMeta =
    (useWatch({ control, name: "meta" }) as Record<string, unknown>) || {};

  const [newMetaKey, setNewMetaKey] = useState("");
  const [newMetaValue, setNewMetaValue] = useState("");

  const handleAddMeta = () => {
    if (newMetaKey.trim() && newMetaValue.trim()) {
      setValue("meta", {
        ...currentMeta,
        [newMetaKey.trim()]: newMetaValue.trim(),
      });
      setNewMetaKey("");
      setNewMetaValue("");
    } else {
      toast.error("Both key and value are required");
    }
  };

  return (
    <div className="pt-6 border-t border-gray-100 space-y-4">
      <h3 className="text-sm font-bold text-gray-900 px-1">
        Dynamic Attributes
      </h3>
      <div className="space-y-3">
        {Object.entries(currentMeta).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 group">
            <div className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-600 uppercase tracking-tight">
              {k}
            </div>
            <input
              className="flex-[2] px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand/5 outline-none"
              value={String(v)}
              onChange={(e) =>
                setValue("meta", {
                  ...currentMeta,
                  [k]: e.target.value,
                })
              }
            />
            <button
              type="button"
              onClick={() => {
                const nm = { ...currentMeta };
                delete nm[k];
                setValue("meta", nm);
              }}
              className="p-2 text-gray-300 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2">
          <input
            placeholder="Key"
            value={newMetaKey}
            onChange={(e) => setNewMetaKey(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
          />
          <input
            placeholder="Value"
            value={newMetaValue}
            onChange={(e) => setNewMetaValue(e.target.value)}
            className="flex-[2] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
          />
          <button
            type="button"
            onClick={handleAddMeta}
            className="p-3 bg-brand/10 text-brand rounded-xl hover:bg-brand hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
