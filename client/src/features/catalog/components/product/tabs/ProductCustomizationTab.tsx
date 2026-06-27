import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import type { ProductFormValues } from "../../../../../schemas/catalog.schema";
import { OptionValuesBuilder } from "../../option-group/OptionValuesBuilder";
import { ProductMetaEditor } from "./ProductMetaEditor";

export function ProductCustomizationTab() {
  const { register, control } = useFormContext<ProductFormValues>();

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: "optionGroups",
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-gray-900">
            Add-ons & Modifiers
          </h3>
          <button
            type="button"
            onClick={() =>
              appendGroup({ name: "", isRequired: false, values: [] })
            }
            className="flex items-center gap-1 px-3 py-1.5 bg-brand/5 text-brand text-xs font-bold rounded-xl hover:bg-brand/10"
          >
            <Plus className="w-3.5 h-3.5" /> Add Group
          </button>
        </div>

        <div className="space-y-4">
          {groupFields.map((field, idx) => (
            <div
              key={field.id}
              className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <input
                  {...register(`optionGroups.${idx}.name`)}
                  placeholder="Group Name (e.g. Toppings)"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register(`optionGroups.${idx}.isRequired`)}
                    className="w-4 h-4 rounded text-brand focus:ring-brand"
                  />
                  <span className="text-xs font-bold text-gray-500">
                    Required
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Min:</span>
                  <input
                    type="number"
                    min="0"
                    {...register(`optionGroups.${idx}.minSelect`, { valueAsNumber: true })}
                    className="w-16 px-2 py-1 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Max:</span>
                  <input
                    type="number"
                    min="1"
                    {...register(`optionGroups.${idx}.maxSelect`, { valueAsNumber: true })}
                    className="w-16 px-2 py-1 text-sm bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeGroup(idx)}
                  className="p-1.5 text-gray-300 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="pl-4 border-l-2 border-gray-200">
                <OptionValuesBuilder groupIndex={idx} />
              </div>
            </div>
          ))}
          {groupFields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-xs text-gray-400 font-medium">
                No modifiers added yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <ProductMetaEditor />
    </div>
  );
}
