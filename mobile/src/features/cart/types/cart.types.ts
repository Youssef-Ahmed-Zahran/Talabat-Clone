// ============================================================
// Cart Types
// ============================================================

export interface Cart {
  id: string;
  userId: string;
  storeId: string;
  items: CartItem[];
  store?: {
    id: string;
    name: string;
    logoUrl: string | null;
    deliveryFees: number;
    minimumOrderCost: number;
  };
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
  };
  options?: CartItemOption[];
}

export interface CartItemOption {
  id: string;
  cartItemId: string;
  optionValueId: string;
  optionValue?: {
    id: string;
    name: string;
    extraPrice: number;
  };
}

export interface AddToCartRequest {
  storeId: string;
  productId: string;
  quantity: number;
  selectedOptions?: string[];
}

export interface UpdateCartItemQuantityRequest {
  quantity: number;
}

export interface CartEmptyStateProps {
  onExplore: () => void;
}

export interface CartItemCardProps {
  item: CartItem;
  onUpdateQty: (itemId: string, quantity: number) => void;
}

export interface CartSummaryFooterProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
}

export interface UseCartReturn {
  query: {
    items: CartItem[];
    cartId: string | null;
    storeId: string | null;
    itemCount: number;
    subtotal: number;
  };
  state: {
    isRemovingItem: boolean;
    isUpdatingQty: boolean;
    isClearingCart: boolean;
  };
  actions: {
    handleRemove: (itemId: string) => void;
    handleClear: () => void;
    handleUpdateQty: (itemId: string, quantity: number) => void;
  };
  router: {
    navigateToCheckout: () => void;
    navigateToHome: () => void;
  };
}
