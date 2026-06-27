import { Loader2, Package } from "lucide-react";

interface ProductFooterActionsProps {
  onClose: () => void;
  isPending: boolean;
  isEditing: boolean;
  formId: string;
}

export function ProductFooterActions({
  onClose,
  isPending,
  isEditing,
  formId,
}: ProductFooterActionsProps) {
  return (
    <div className="flex justify-end gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Package className="w-4 h-4" />
        )}
        {isEditing ? "Update Product" : "Create Product"}
      </button>
    </div>
  );
}
