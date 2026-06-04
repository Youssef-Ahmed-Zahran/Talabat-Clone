import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useZones,
  useUpdateZone,
  useDeleteZone,
} from "../api/zones.api";
import type { Zone } from "../../../types";

export function useZonesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: response, isLoading, error, refetch } = useZones(undefined, page, limit);
  const zones = response?.zones || [];
  const pagination = response?.pagination || null;

  type ModalState =
    | { type: "NONE" }
    | { type: "DELETE_CONFIRM"; zoneId: string };

  const [modalState, setModalState] = useState<ModalState>({ type: "NONE" });
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const confirmDelete = (zoneId: string) => setModalState({ type: "DELETE_CONFIRM", zoneId });
  const closeModal = () => setModalState({ type: "NONE" });

  const updateZoneMutation = useUpdateZone();
  const deleteZoneMutation = useDeleteZone();

  const handleToggleActive = async (zone: Zone) => {
    setTogglingId(zone.id);
    try {
      await updateZoneMutation.mutateAsync({
        id: zone.id,
        isActive: !zone.isActive,
      });
      toast.success(
        `Zone "${zone.name}" ${!zone.isActive ? "activated" : "deactivated"}.`,
      );
    } catch {
      toast.error("Failed to toggle zone status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteZoneMutation.mutateAsync(id);
      toast.success("Zone deleted successfully.");
      closeModal();
    } catch {
      toast.error("Failed to delete zone.");
    }
  };

  const goToNewZone = () => navigate("/zones/new");
  const goToEditZone = (id: string) => navigate(`/zones/${id}/edit`);

  return {
    query: {
      zones,
      pagination,
      isLoading,
      error,
      refetch,
    },
    modal: {
      state: modalState,
      confirmDelete,
      close: closeModal,
    },
    state: {
      togglingId,
      page,
      setPage,
      limit,
    },
    actions: {
      handleToggleActive,
      handleDelete,
    },
    router: {
      goToNewZone,
      goToEditZone,
    },
  };
}
