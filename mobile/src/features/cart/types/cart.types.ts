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
