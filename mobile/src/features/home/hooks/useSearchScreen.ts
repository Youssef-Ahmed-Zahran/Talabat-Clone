import React, { useState, useRef, useCallback, useEffect } from "react";
import { TextInput, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSearch } from "../api/search.api";
import { useLocationStore } from "@src/store/locationStore";
import { useDebouncing } from "@src/hooks/useDebouncing";

const EMPTY_STORES: any[] = [];
const EMPTY_PRODUCTS: any[] = [];

type TabType = "all" | "stores" | "products";

export function useSearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const { selectedLatitude, selectedLongitude } = useLocationStore();

  const [rawQuery, setRawQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem("recent_searches");
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load recent searches", e);
      }
    };
    loadRecentSearches();
  }, []);

  const addRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const stored = await AsyncStorage.getItem("recent_searches");
      let list: string[] = stored ? JSON.parse(stored) : [];
      list = [
        trimmed,
        ...list.filter((x) => x.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 5);
      setRecentSearches(list);
      await AsyncStorage.setItem("recent_searches", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save recent search", e);
    }
  }, []);

  const removeRecentSearch = useCallback(async (term: string) => {
    try {
      const stored = await AsyncStorage.getItem("recent_searches");
      let list: string[] = stored ? JSON.parse(stored) : [];
      list = list.filter((x) => x !== term);
      setRecentSearches(list);
      await AsyncStorage.setItem("recent_searches", JSON.stringify(list));
    } catch (e) {
      console.error("Failed to remove recent search", e);
    }
  }, []);

  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem("recent_searches");
    } catch (e) {
      console.error("Failed to clear recent searches", e);
    }
  }, []);

  const query = useDebouncing(rawQuery, 400);
  const { data, isLoading, isFetching } = useSearch(
    query,
    selectedLatitude,
    selectedLongitude,
  );

  const handleStorePress = useCallback(
    (storeId: string) => {
      Keyboard.dismiss();
      router.push({ pathname: "/stores/detail", params: { storeId } });
    },
    [router],
  );

  const handleProductPress = useCallback(
    (storeId: string) => {
      Keyboard.dismiss();
      router.push({ pathname: "/stores/detail", params: { storeId } });
    },
    [router],
  );

  const showEmpty =
    query.length >= 2 &&
    !isLoading &&
    !isFetching &&
    !!data &&
    data.stores.length === 0 &&
    data.products.length === 0;

  const stores = data?.stores ?? EMPTY_STORES;
  const products = data?.products ?? EMPTY_PRODUCTS;

  type ListItem =
    | { type: "section_header"; title: string; key: string }
    | { type: "store"; item: (typeof stores)[0]; key: string }
    | { type: "product"; item: (typeof products)[0]; key: string };

  const listData: ListItem[] = React.useMemo(() => {
    if (activeTab === "stores") {
      return stores.map((s) => ({
        type: "store" as const,
        item: s,
        key: `store-${s.id}`,
      }));
    }
    if (activeTab === "products") {
      return products.map((p) => ({
        type: "product" as const,
        item: p,
        key: `product-${p.id}`,
      }));
    }
    // 'all'
    const items: ListItem[] = [];
    if (stores.length > 0) {
      items.push({
        type: "section_header",
        title: `Restaurants & Stores (${stores.length})`,
        key: "hdr-stores",
      });
      stores.forEach((s) =>
        items.push({ type: "store", item: s, key: `store-${s.id}` }),
      );
    }
    if (products.length > 0) {
      items.push({
        type: "section_header",
        title: `Menu Items (${products.length})`,
        key: "hdr-products",
      });
      products.forEach((p) =>
        items.push({ type: "product", item: p, key: `product-${p.id}` }),
      );
    }
    return items;
  }, [activeTab, stores, products]);

  return {
    query: {
      data,
      isLoading,
      isFetching,
      stores,
      products,
      showEmpty,
      listData,
    },
    filters: {
      rawQuery,
      setRawQuery,
      activeTab,
      setActiveTab,
    },
    actions: {
      handleStorePress,
      handleProductPress,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
    },
    history: {
      recentSearches,
    },
    refs: {
      inputRef,
    },
    router,
  };
}
