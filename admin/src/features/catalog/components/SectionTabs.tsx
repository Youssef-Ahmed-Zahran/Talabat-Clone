import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Section } from "../../../types";

interface SectionTabsProps {
  sections?: Section[];
  activeSectionId: string | null;
  onSectionChange: (id: string | null) => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
}

export function SectionTabs({
  sections,
  activeSectionId,
  onSectionChange,
  onEditSection,
  onDeleteSection,
}: SectionTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSectionChange(null)}
        className={`shrink-0 px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
          activeSectionId === null
            ? "bg-brand text-white border-brand shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
      >
        All Products
      </button>
      {sections?.map((s) => (
        <div key={s.id} className="relative group shrink-0">
          <button
            onClick={() => onSectionChange(s.id)}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
              activeSectionId === s.id
                ? "bg-brand text-white border-brand shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3 h-3 opacity-40" />
              {s.name}
              {s.products_count && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeSectionId === s.id
                      ? "bg-white/20"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s.products_count}
                </span>
              )}
            </span>
          </button>
          {/* Section quick actions */}
          <div className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditSection(s);
              }}
              className="p-1 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-blue-50 transition-colors"
            >
              <Pencil className="w-2.5 h-2.5 text-blue-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSection(s);
              }}
              className="p-1 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
