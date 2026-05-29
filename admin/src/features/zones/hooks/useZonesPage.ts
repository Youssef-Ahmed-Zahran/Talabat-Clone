import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useZones,
  useUpdateZone,
  useDeleteZone,
  type Zone,
} from "../api/zones.api";

export function useZonesPage() {
  const navigate = useNavigate();
  const { data: zones = [], isLoading, error, refetch } = useZones();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete zone.");
    }
  };

  const goToNewZone = () => navigate("/zones/new");
  const goToEditZone = (id: string) => navigate(`/zones/${id}/edit`);

  return {
    query: {
      zones,
      isLoading,
      error,
      refetch,
    },
    state: {
      deleteConfirm,
      setDeleteConfirm,
      togglingId,
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
