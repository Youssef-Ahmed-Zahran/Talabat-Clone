import { Store } from "./store.types";
// stores Types
export interface StoreListCardProps {
  store: Store;
  onPress: (storeId: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (storeId: string) => void;
}

export interface SubCategoryFilterProps {
  subCategories: any[];
  selectedSubCategory: string | null;
  onSelect: (id: string | null) => void;
}

export interface UseStoresListReturn {
  query: {
    categoryName: string | undefined;
    stores: Store[];
    zone: any;
    outsideZone: boolean;
    isLoading: boolean;
    isFetching: boolean;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    subCategories: any[] | undefined;
    wishlistedStoreIds: Set<string>;
  };
  state: {
    selectedSubCategory: string | null;
    setSelectedSubCategory: (id: string | null) => void;
  };
  router: {
    navigateToStore: (storeId: string) => void;
    navigateBack: () => void;
  };
  actions: {
    toggleWishlist: (storeId: string) => void;
    fetchNextPage: () => void;
  };
}
