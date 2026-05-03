import { Link } from "react-router-dom";
import {
  Package,
  Eye,
  EyeOff,
  DollarSign,
  Pencil,
  ChevronRight,
  Trash2,
} from "lucide-react";
import type { Product } from "../../../types";

interface ProductCardProps {
  product: Product;
  storeId: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleAvailability: (product: Product) => void;
}

export function ProductCard({
  product: p,
  storeId: sid,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ProductCardProps) {
  return (
    <div
      className={`group bg-white rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
        p.is_available ? "border-gray-100" : "border-red-100 opacity-75"
      }`}
    >
      {/* Product Image */}
      <div className="relative h-36 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {p.primary_image_url ? (
          <img
            src={p.primary_image_url}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-200" />
          </div>
        )}
        {/* Availability badge */}
        <button
          onClick={() => onToggleAvailability(p)}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
            p.is_available
              ? "bg-emerald-500/90 text-white hover:bg-emerald-600"
              : "bg-red-500/90 text-white hover:bg-red-600"
          }`}
        >
          {p.is_available ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {p.name}
        </h3>
        {p.description && (
          <p className="text-[12px] text-gray-400 mt-1 line-clamp-2">
            {p.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-sm font-bold text-gray-900">
              {Number(p.price).toFixed(2)}
            </span>
            <span className="text-[10px] text-gray-400 ml-0.5">EGP</span>
          </div>
          {p.quantity != null && (
            <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              Qty: {p.quantity}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => onEdit(p)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <Link
            to={`/stores/${sid}/catalog/products/${p.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-brand bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
          >
            Options
            <ChevronRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => onDelete(p)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
