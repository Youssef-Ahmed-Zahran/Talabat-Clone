import { Product } from "../../stores/types/store.types";
// products Types
export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  layout?: "list" | "grid";
}

export interface ProductOptionsModalProps {
  visible: boolean;
  product: Product | null;
  storeId: string;
  onClose: () => void;
}

export interface StoreReviewsProps {
  storeId: string;
}

export interface UseProductsReturn {
  query: {
    store: any;
    sections: any[] | undefined;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => void;
    isAddingToCart: boolean;
    storeIsOpen: boolean;
    hoursLabel: string | null;
    isWishlisted: boolean;
  };
  state: {
    selectedProduct: Product | null;
    isModalVisible: boolean;
  };
  actions: {
    handleAddToCart: (product: Product) => void;
    handleAddToCartWithOptions: (
      productId: string,
      quantity: number,
      selectedOptions: string[],
    ) => void;
    closeModal: () => void;
    toggleWishlist: () => void;
  };
  router: {
    navigateBack: () => void;
  };
}
