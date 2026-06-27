import { Package, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { Product } from "../../../../types";

interface ProductCardProps {
  product: Product;
  storeId?: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleAvailability: (product: Product) => void;
}

export function ProductCard({
  product: p,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ProductCardProps) {
  return (
    <div
      className={`group bg-white rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col border ${
        p.is_available
          ? "border-gray-100/80 premium-shadow"
          : "border-red-100/80 bg-red-50/10 opacity-80"
      }`}
    >
      {/* Product Image */}
      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {p.primary_image_url ? (
          <img
            src={p.primary_image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/400x400/f8fafc/94a3b8?text=Image+Not+Found";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-200" />
          </div>
        )}
        {/* Availability badge */}
        <button
          onClick={() => onToggleAvailability(p)}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm ${
            p.is_available
              ? "bg-emerald-500/90 text-white hover:bg-emerald-600 hover:scale-105"
              : "bg-red-500/90 text-white hover:bg-red-600 hover:scale-105"
          }`}
        >
          {p.is_available ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 tracking-tight truncate">
            {p.name}
          </h3>
          {p.description && (
            <p className="text-[12px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
              {p.description}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">
                Price
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-extrabold text-gray-900 tracking-tight">
                  {Number(p.price).toFixed(2)}
                </span>
                <span className="text-[11px] font-bold text-gray-500 ml-1">
                  EGP
                </span>
              </div>
            </div>
            {p.quantity != null && (
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">
                  Stock
                </span>
                <span className="inline-flex items-center text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-100/80 px-2.5 py-1 rounded-xl">
                  {p.quantity} units
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
            <button
              onClick={() => onEdit(p)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-brand bg-brand-50 border border-brand-100/30 rounded-xl hover:bg-brand hover:text-white transition-all shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Product
            </button>
            <button
              onClick={() => onDelete(p)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100/50 rounded-xl transition-all"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
