import { useState, useEffect } from "react";
import {
  useAssignStoresToZone,
  useRemoveStoreFromZone,
  fetchStores,
} from "../api/zones.api";
import type { Zone, ZoneStore } from "../../../types";
import { useDebounce } from "../../../hooks/useDebouncing";
import toast from "react-hot-toast";

export function useZoneStores(id: string | undefined) {
  const assignStoresMutation = useAssignStoresToZone();
  const removeStoreMutation = useRemoveStoreFromZone();

  const [assignedStores, setAssignedStores] = useState<Zone["storeZones"]>([]);
  const [storeSearch, setStoreSearch] = useState("");
  const debouncedSearch = useDebounce(storeSearch, 400);
  const [storeResults, setStoreResults] = useState<ZoneStore[]>([]);
  const [searchingStores, setSearchingStores] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchResults = async () => {
      if (!debouncedSearch.trim()) {
        if (isMounted) setStoreResults([]);
        return;
      }

      setSearchingStores(true);
      try {
        const results = await fetchStores(debouncedSearch);
        if (isMounted) setStoreResults(results);
      } catch {
        if (isMounted) setStoreResults([]);
      } finally {
        if (isMounted) setSearchingStores(false);
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

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
