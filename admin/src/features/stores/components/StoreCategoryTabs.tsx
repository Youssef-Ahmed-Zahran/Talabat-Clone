import type { Category } from "../../../types";

interface StoreCategoryTabsProps {
  categories?: Category[];
  activeTab?: string;
  onTabChange: (tabId?: string) => void;
  subCategories?: Category[];
  activeSubTab?: string;
  onSubTabChange: (subTabId?: string) => void;
}

export function StoreCategoryTabs({
  categories,
  activeTab,
  onTabChange,
  subCategories,
  activeSubTab,
  onSubTabChange,
}: StoreCategoryTabsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => onTabChange(undefined)}
          className={`px-4 py-2 text-[13px] font-medium rounded-lg whitespace-nowrap transition-all ${
            activeTab === undefined
              ? "bg-brand text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {categories?.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => onTabChange(cat.id)}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === cat.id
                ? "bg-brand text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeTab && subCategories && subCategories.length > 0 && (
        <div className="flex items-center gap-1 bg-gray-50/50 rounded-xl border border-gray-100 p-1 overflow-x-auto mt-2">
          <button
            type="button"
            onClick={() => onSubTabChange(undefined)}
            className={`px-4 py-2 text-[12px] font-medium rounded-lg whitespace-nowrap transition-all ${
              activeSubTab === undefined
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Sub-Categories
          </button>
          {subCategories.map((sub) => (
            <button
              type="button"
              key={sub.id}
              onClick={() => onSubTabChange(sub.id)}
              className={`px-4 py-2 text-[12px] font-medium rounded-lg whitespace-nowrap transition-all ${
                activeSubTab === sub.id
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
