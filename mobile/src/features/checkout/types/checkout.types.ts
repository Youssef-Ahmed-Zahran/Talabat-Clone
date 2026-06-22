// checkout Types
export interface AddressOptionProps {
  address: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export interface PaymentOptionProps {
  method: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export interface UseCheckoutReturn {
  query: {
    storeId: string;
    cart: any;
    cartLoading: boolean;
    addresses: any[] | undefined;
    methods: any[];
  };
  state: {
    selectedPayment: string;
    setSelectedPayment: (id: string) => void;
    selectedAddress: string;
    setSelectedAddress: (id: string) => void;
    tipAmount: number;
    setTipAmount: (amount: number) => void;
    customTip: string;
    isCustom: boolean;
    setIsCustom: (val: boolean) => void;
    handlePresetTip: (amount: number) => void;
    handleCustomTipChange: (val: string) => void;
  };
  totals: {
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  actions: {
    isPlacingOrder: boolean;
    handlePlaceOrder: () => void;
  };
  router: {
    navigateBack: () => void;
    navigateToAddresses: () => void;
  };
}
