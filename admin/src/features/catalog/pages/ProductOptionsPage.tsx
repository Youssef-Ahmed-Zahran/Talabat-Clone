import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Package, Settings2 } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { OptionGroupModal } from "../components/OptionGroupModal";
import { OptionValueModal } from "../components/OptionValueModal";
import { OptionGroupCard } from "../components/OptionGroupCard";
import { useProductOptions } from "../hooks/useProductOptions";

export default function ProductOptionsPage() {
  const {
    sid,
    pid,
    role,
    product,
    prodLoading,
    prodError,
    refetchProd,
    optionGroups,
    groupsLoading,
    refetchGroups,
    showGroupModal,
    setShowGroupModal,
    editingGroup,
    showValueModal,
    setShowValueModal,
    activeGroupId,
    editingValue,
    expandedGroups,
    toggleGroupExpand,
    openCreateGroup,
    openEditGroup,
    handleDeleteGroup,
    openAddValue,
    openEditValue,
    handleDeleteValue,
  } = useProductOptions();

  if (prodLoading || groupsLoading) return <PageLoader />;
  if (prodError) return <ErrorFallback onRetry={refetchProd} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={
              role === "owner" ? `/my-store/catalog` : `/stores/${sid}/catalog`
            }
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            {product?.primary_image_url ? (
              <img
                src={product.primary_image_url}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-gray-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <Package className="w-5 h-5 text-gray-300" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {product?.name}
              </h1>
              <p className="text-sm text-gray-500">
                EGP {Number(product?.price || 0).toFixed(2)} · Option Groups &
                Values
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreateGroup}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Option Group
        </button>
      </div>

      {optionGroups && optionGroups.length > 0 ? (
        <div className="space-y-4">
          {optionGroups.map((g) => (
            <OptionGroupCard
              key={g.id}
              group={g}
              isExpanded={expandedGroups.has(g.id)}
              onToggleExpand={toggleGroupExpand}
              onAddValue={openAddValue}
              onEditGroup={openEditGroup}
              onDeleteGroup={handleDeleteGroup}
              onEditValue={openEditValue}
              onDeleteValue={handleDeleteValue}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Settings2 className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-600">
            No option groups
          </h3>
          <p className="text-[13px] text-gray-400 mt-1">
            Add option groups like "Size", "Toppings", "Extras" to this product.
          </p>
          <button
            onClick={openCreateGroup}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Group
          </button>
        </div>
      )}

      <OptionGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        editingGroup={editingGroup}
        storeId={sid}
        productId={pid}
        onSuccess={refetchGroups}
      />

      <OptionValueModal
        isOpen={showValueModal}
        onClose={() => setShowValueModal(false)}
        editingValue={editingValue}
        storeId={sid}
        activeGroupId={activeGroupId}
        onSuccess={refetchGroups}
      />
    </div>
  );
}
