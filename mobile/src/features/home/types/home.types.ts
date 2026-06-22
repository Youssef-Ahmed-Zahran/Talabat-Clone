import { Store, MainCategory } from "../../stores/types/store.types";
// home Types
export interface SearchProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  storeId: string;
  store: Store;
}

export interface SearchResult {
  query: string;
  stores: (Store & { distanceKm: number | null })[];
  products: SearchProduct[];
  meta: { storeCount: number; productCount: number };
}

export interface ActiveOrderBannerProps {
  orderId: string;
  currentStatus: string;
  currentStep: number;
  STATUS_STEPS: string[];
  deliveryType?: string;
  onPress: () => void;
}

export interface CategoryCardProps {
  category: MainCategory;
  onPress: (categoryId: string, categoryName: string) => void;
}

export interface FilterChipsProps {
  selected: string;
  onSelect: (id: string) => void;
}

export interface ProductResultProps {
  product: SearchProduct;
  onPress: () => void;
}

export interface SearchBarProps {
  onPress?: () => void;
}

export interface EmptyStateProps {
  query: string;
}

export interface StoreCardProps {
  store: Store;
  onPress: (storeId: string) => void;
}

export interface StoreResultProps {
  store: Store & { distanceKm: number | null };
  onPress: () => void;
}

export interface UseHomeReturn {
  query: {
    categories: MainCategory[] | undefined;
    stores: Store[];
    catLoading: boolean;
    storesLoading: boolean;
  };
  state: {
    defaultAddress: any;
    refreshing: boolean;
    onRefresh: () => Promise<void>;
  };
  tracking: {
    activeOrderId: string | null;
    currentStatus: string;
    currentStep: number;
    isFinished: boolean;
    STATUS_STEPS: string[];
    deliveryType: string | undefined;
  };
  router: {
    navigateToCategory: (categoryId: string, categoryName: string) => void;
    navigateToStore: (storeId: string) => void;
    navigateToTracking: (orderId: string) => void;
    navigateToLocation: () => void;
    navigateToAllStores: () => void;
  };
}
