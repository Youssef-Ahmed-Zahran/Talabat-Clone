import { GripVertical, Pencil, Trash2, LayoutGrid } from "lucide-react";
import type { Section } from "../../../types";

interface SectionTabsProps {
  sections?: Section[];
  activeSectionId: string | null;
  onSectionChange: (id: string | null) => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
}

export function SectionNav({
  sections,
  activeSectionId,
  onSectionChange,
  onEditSection,
  onDeleteSection,
}: SectionTabsProps) {
  return (
    <div className="space-y-1.5">
      <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
        Menu Sections
      </p>

      <button
        onClick={() => onSectionChange(null)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          activeSectionId === null
            ? "bg-brand text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
        }`}
      >
        <div className="flex items-center gap-3">
          <LayoutGrid
            className={`w-4 h-4 ${activeSectionId === null ? "text-white" : "text-gray-400"}`}
          />
          <span>All Products</span>
        </div>
      </button>

      {sections?.map((s) => (
        <div key={s.id} className="relative group">
          <button
            onClick={() => onSectionChange(s.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSectionId === s.id
                ? "bg-brand text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <GripVertical
                className={`w-4 h-4 shrink-0 ${activeSectionId === s.id ? "text-white/40" : "text-gray-300"}`}
              />
              <span className="truncate">{s.name}</span>
            </div>

            <div className="flex items-center gap-2">
              {s.products_count && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeSectionId === s.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600"
                  }`}
                >
                  {s.products_count}
                </span>
              )}

              <div
                className={`flex items-center gap-0.5 transition-opacity duration-200 ${activeSectionId === s.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSection(s);
                  }}
                  className={`p-1 rounded-md transition-colors ${activeSectionId === s.id ? "hover:bg-white/20" : "hover:bg-white shadow-sm border border-gray-100"}`}
                >
                  <Pencil
                    className={`w-3 h-3 ${activeSectionId === s.id ? "text-white" : "text-blue-500"}`}
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(s);
                  }}
                  className={`p-1 rounded-md transition-colors ${activeSectionId === s.id ? "hover:bg-white/20" : "hover:bg-white shadow-sm border border-gray-100"}`}
                >
                  <Trash2
                    className={`w-3 h-3 ${activeSectionId === s.id ? "text-white" : "text-red-500"}`}
                  />
                </button>
              </div>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
