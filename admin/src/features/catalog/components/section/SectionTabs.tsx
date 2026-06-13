import { GripVertical, Pencil, Trash2, LayoutGrid } from "lucide-react";
import type { Section } from "../../../../types";

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
    <div className="bg-white p-4 rounded-3xl border border-gray-100/80 premium-shadow space-y-4">
      <div>
        <p className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
          Menu Sections
        </p>
      </div>

      <div className="space-y-1.5">
        <button
          onClick={() => onSectionChange(null)}
          className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
            activeSectionId === null
              ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-lg shadow-brand/15"
              : "text-gray-600 hover:text-brand hover:bg-brand-50/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutGrid
              className={`w-4 h-4 transition-colors ${activeSectionId === null ? "text-white" : "text-gray-400"}`}
            />
            <span>All Products</span>
          </div>
        </button>

        {sections?.map((s) => (
          <div key={s.id} className="relative group">
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSectionChange(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSectionChange(s.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeSectionId === s.id
                  ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-lg shadow-brand/15"
                  : "text-gray-600 hover:text-brand hover:bg-brand-50/50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical
                  className={`w-4 h-4 shrink-0 transition-colors ${activeSectionId === s.id ? "text-white/40" : "text-gray-300 group-hover:text-brand/40"}`}
                />
                <span className="truncate">{s.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {s.products_count !== undefined &&
                  s.products_count !== null && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${
                        activeSectionId === s.id
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-400 group-hover:bg-brand-100 group-hover:text-brand-700"
                      }`}
                    >
                      {s.products_count}
                    </span>
                  )}

                <div
                  className={`flex items-center gap-1 transition-all duration-200 ${
                    activeSectionId === s.id
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSection(s);
                    }}
                    className={`p-1.5 rounded-xl transition-all ${
                      activeSectionId === s.id
                        ? "hover:bg-white/20 text-white"
                        : "hover:bg-blue-50 text-blue-500 hover:scale-105 border border-transparent hover:border-blue-100/50"
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSection(s);
                    }}
                    className={`p-1.5 rounded-xl transition-all ${
                      activeSectionId === s.id
                        ? "hover:bg-white/20 text-white"
                        : "hover:bg-red-50 text-red-500 hover:scale-105 border border-transparent hover:border-red-100/50"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
