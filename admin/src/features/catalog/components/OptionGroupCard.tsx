import {
  Settings2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import type { OptionGroup, OptionValue } from "../../../types";

interface OptionGroupCardProps {
  group: OptionGroup;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onAddValue: (id: string) => void;
  onEditGroup: (group: OptionGroup) => void;
  onDeleteGroup: (group: OptionGroup) => void;
  onEditValue: (groupId: string, value: OptionValue) => void;
  onDeleteValue: (id: string) => void;
}

export function OptionGroupCard({
  group: g,
  isExpanded,
  onToggleExpand,
  onAddValue,
  onEditGroup,
  onDeleteGroup,
  onEditValue,
  onDeleteValue,
}: OptionGroupCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => onToggleExpand(g.id)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{g.name}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {g.is_required ? "Required" : "Optional"} · Min: {g.min_select} ·
              Max: {g.max_select}
              {g.values ? ` · ${g.values.length} value(s)` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddValue(g.id);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-brand bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Value
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditGroup(g);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(g);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-50">
          {g.values && g.values.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {g.values.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-6 py-3 pl-16 hover:bg-gray-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-300" />
                    <span className="text-sm text-gray-700">{v.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {v.extra_price > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <DollarSign className="w-3 h-3" />+
                        {Number(v.extra_price).toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => onEditValue(g.id, v)}
                      className="p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteValue(v.id)}
                      className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-4 pl-16 text-sm text-gray-400">
              No values yet. Add one above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
