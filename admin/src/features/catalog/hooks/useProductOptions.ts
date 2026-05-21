import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/authStore";
import {
  useProduct,
  useOptionGroups,
  useDeleteOptionGroup,
  useDeleteOptionValue,
} from "../api/catalog.api";
import type { OptionGroup, OptionValue } from "../../../types";

export function useProductOptions() {
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

  return {
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
  };
}
