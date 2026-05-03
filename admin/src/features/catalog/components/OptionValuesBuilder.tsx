import {
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { type ProductFormValues } from "../../../schemas/catalog.schema";

interface OptionValuesBuilderProps {
  control: Control<ProductFormValues>;
  groupIndex: number;
  register: UseFormRegister<ProductFormValues>;
}

export function OptionValuesBuilder({
  control,
  groupIndex,
  register,
}: OptionValuesBuilderProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `optionGroups.${groupIndex}.values`,
  });

  return (
    <div className="space-y-2">
      {fields.map((field, valIndex) => (
        <div key={field.id} className="flex items-center gap-2">
          <input
            type="text"
            {...register(`optionGroups.${groupIndex}.values.${valIndex}.name`)}
            placeholder="Option (e.g. Large)"
            className="flex-1 px-2.5 py-1.5 text-[12px] bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none"
          />
          <input
            type="number"
            {...register(
              `optionGroups.${groupIndex}.values.${valIndex}.extraPrice`,
              { valueAsNumber: true },
            )}
            placeholder="+0.00"
            className="w-20 px-2.5 py-1.5 text-[12px] bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none"
          />
          <button
            type="button"
            onClick={() => remove(valIndex)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ name: "", extraPrice: 0 })}
        className="text-[11px] font-semibold text-brand hover:text-brand-dark flex items-center gap-1 mt-1"
      >
        <Plus className="w-3 h-3" />
        Add Option
      </button>
    </div>
  );
}
