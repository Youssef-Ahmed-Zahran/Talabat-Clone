import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  /**
   * Build the page list with ellipsis markers.
   * Always shows: first page, last page, and a window of 2 pages around current.
   * Inserts "..." (represented as null) where gaps exist.
   *
   * Example for totalPages=12, currentPage=6:
   *   1, ..., 5, 6, 7, ..., 12
   */
  const buildPages = (): (number | null)[] => {
    const delta = 1; // pages on each side of current
    const range: number[] = [];

    // Generate the "inner" window
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    for (let i = left; i <= right; i++) range.push(i);

    const pages: (number | null)[] = [];

    // Always add page 1
    pages.push(1);
    if (left > 2) pages.push(null); // left ellipsis
    pages.push(...range);
    if (right < totalPages - 1) pages.push(null); // right ellipsis
    if (totalPages > 1) pages.push(totalPages); // always add last

    return pages;
  };

  const pages = buildPages();

  const btnBase =
    "h-9 min-w-[36px] px-3 text-sm font-medium rounded-lg transition-colors shadow-sm border";
  const btnActive = "bg-brand text-white border-brand";
  const btnInactive = "text-gray-600 bg-white border-gray-200 hover:bg-gray-50";
  const btnNav =
    "p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm";

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-50">
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-900">
            {(currentPage - 1) * itemsPerPage + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-gray-900">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          of <span className="font-medium text-gray-900">{totalItems}</span>{" "}
          results
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={btnNav}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers with ellipsis */}
        {pages.map((p, idx) =>
          p === null ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex items-center justify-center w-9 h-9 text-gray-400"
            >
              <MoreHorizontal className="w-4 h-4" />
            </span>
          ) : (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={currentPage === p ? "page" : undefined}
              className={`${btnBase} ${
                currentPage === p ? btnActive : btnInactive
              }`}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={btnNav}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
