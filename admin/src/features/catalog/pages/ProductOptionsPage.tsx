import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { ArrowLeft, Plus, Package, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useProduct,
  useOptionGroups,
  useDeleteOptionGroup,
  useDeleteOptionValue,
} from "../api/catalog.api";
import type { OptionGroup, OptionValue } from "../../../types";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { OptionGroupModal } from "../components/OptionGroupModal";
import { OptionValueModal } from "../components/OptionValueModal";
import { OptionGroupCard } from "../components/OptionGroupCard";

export default function ProductOptionsPage() {
  const params = useParams<{
    storeId: string;
    productId: string;
  }>();
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
    data: optionGroups,
    isLoading: groupsLoading,
    refetch: refetchGroups,
  } = useOptionGroups(sid, pid);

  // ✅ Only delete mutations remain here — they're triggered from the page, not a modal
  const deleteGroupMut = useDeleteOptionGroup(sid);
  const deleteValueMut = useDeleteOptionValue(sid);

  // ── Modal state ─────────────────────────────────────────────
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);

  const [showValueModal, setShowValueModal] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<OptionValue | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const openEditGroup = (g: OptionGroup) => {
    setEditingGroup(g);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = (g: OptionGroup) => {
    if (!confirm(`Delete option group "${g.name}" and all its values?`)) return;
    deleteGroupMut.mutate(g.id, {
      onSuccess: () => {
        toast.success("Option group deleted");
        refetchGroups();
      },
      onError: () => toast.error("Failed to delete"),
    });
  };

  const openAddValue = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingValue(null);
    setShowValueModal(true);
  };

  const openEditValue = (groupId: string, v: OptionValue) => {
    setActiveGroupId(groupId);
    setEditingValue(v);
    setShowValueModal(true);
  };

  const handleDeleteValue = (valueId: string) => {
    if (!confirm("Delete this option value?")) return;
    deleteValueMut.mutate(valueId, {
      onSuccess: () => {
        toast.success("Value deleted");
        refetchGroups();
      },
      onError: () => toast.error("Failed to delete"),
    });
  };

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
