import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Package, Settings2 } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { OptionGroupModal } from "../components/option-group/OptionGroupModal";
import { OptionValueModal } from "../components/option-group/OptionValueModal";
import { OptionGroupCard } from "../components/option-group/OptionGroupCard";
import { useProduct } from "../api/catalog.api";
import { useOptionGroupsManager } from "../hooks/useOptionGroupsManager";
import { useOptionValuesManager } from "../hooks/useOptionValuesManager";

export default function ProductOptionsPage() {
  const params = useParams<{ storeId: string; productId: string }>();
  const authStoreId = useAuthStore((s) => s.storeId);
  const role = useAuthStore((s) => s.role);

  const sid = params.storeId || authStoreId || "";
  const pid = params.productId || "";

  const {
    data: product,
    isLoading: prodLoading,
    isError: prodError,
    refetch: refetchProd,
  } = useProduct(sid, pid);

  const {
    query: groupsQuery,
    state: groupsState,
    modal: groupsModal,
    actions: groupsActions,
  } = useOptionGroupsManager(sid, pid);


  const { modal: valuesModal, actions: valuesActions } = useOptionValuesManager(sid);


  if (prodLoading || groupsQuery.isLoading) return <PageLoader />;
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
          onClick={groupsModal.openCreateGroup}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Option Group
        </button>
      </div>

      {groupsQuery.optionGroups && groupsQuery.optionGroups.length > 0 ? (
        <div className="space-y-4">
          {groupsQuery.optionGroups.map((g) => (
            <OptionGroupCard
              key={g.id}
              group={g}
              isExpanded={groupsState.expandedGroups.has(g.id)}
              onToggleExpand={groupsState.toggleGroupExpand}
              onAddValue={valuesModal.openAddValue}
              onEditGroup={groupsModal.openEditGroup}
              onDeleteGroup={groupsActions.handleDeleteGroup}
              onEditValue={valuesModal.openEditValue}
              onDeleteValue={valuesActions.handleDeleteValue}
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
            onClick={groupsModal.openCreateGroup}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Group
          </button>
        </div>
      )}

      <OptionGroupModal
        isOpen={groupsModal.isOpen}
        onClose={() => groupsModal.setIsOpen(false)}
        onSubmit={groupsActions.handleSubmitGroup}
        isPending={groupsActions.isPending}
        editingGroup={groupsModal.editingGroup}
      />

      <OptionValueModal
        isOpen={valuesModal.isOpen}
        onClose={() => valuesModal.setIsOpen(false)}
        onSubmit={valuesActions.handleSubmitValue}
        isPending={valuesActions.isPending}
        editingValue={valuesModal.editingValue}
      />
    </div>
  );
}
