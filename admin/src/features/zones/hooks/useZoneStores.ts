import { useState, useEffect } from "react";
import {
  useAssignStoresToZone,
  useRemoveStoreFromZone,
  fetchStores,
  type Zone,
  type ZoneStore,
} from "../api/zones.api";
import toast from "react-hot-toast";

export function useZoneStores(id: string | undefined) {
  const assignStoresMutation = useAssignStoresToZone();
  const removeStoreMutation = useRemoveStoreFromZone();

  const [assignedStores, setAssignedStores] = useState<Zone["storeZones"]>([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeResults, setStoreResults] = useState<ZoneStore[]>([]);
  const [searchingStores, setSearchingStores] = useState(false);

  useEffect(() => {
    if (!storeSearch.trim()) {
      const t = setTimeout(() => setStoreResults([]), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      setSearchingStores(true);
      try {
        setStoreResults(await fetchStores(storeSearch));
      } catch {
        setStoreResults([]);
      } finally {
        setSearchingStores(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [storeSearch]);

  const handleAddStore = async (store: ZoneStore) => {
    if (!id) return;
    try {
      await assignStoresMutation.mutateAsync({ zoneId: id, storeIds: [store.id] });
      setAssignedStores((prev) => [
        ...(prev || []),
        { id: Math.random().toString(), storeId: store.id, store } as NonNullable<Zone["storeZones"]>[0],
      ]);
      setStoreSearch("");
      setStoreResults([]);
      toast.success(`Store "${store.name}" assigned successfully.`);
    } catch {
      toast.error("Failed to assign store.");
    }
  };

  const handleRemoveStore = async (storeId: string) => {
    if (!id) return;
    try {
      await removeStoreMutation.mutateAsync({ zoneId: id, storeId });
      setAssignedStores((prev) =>
        (prev || []).filter((s) => s.storeId !== storeId && s.store?.id !== storeId),
      );
      toast.success("Store removed successfully.");
    } catch {
      toast.error("Failed to remove store.");
    }
  };

  return {
    assignedStores,
    setAssignedStores,
    storeSearch,
    setStoreSearch,
    storeResults,
    searchingStores,
    handleAddStore,
    handleRemoveStore,
  };
}
