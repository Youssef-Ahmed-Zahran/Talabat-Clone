// payment Types
export interface SavedCard {
  id: string;
  userId: string;
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  gatewayToken: string | null;
  createdAt: string;
}

export interface AddCardRequest {
  lastFour: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault?: boolean;
  gatewayToken?: string;
}

export interface UseAddCardFormReturn {
  state: {
    form: AddCardRequest;
    setForm: React.Dispatch<React.SetStateAction<AddCardRequest>>;
    expiry: string;
  };
  actions: {
    handleExpiryChange: (val: string) => void;
    handleSubmit: () => void;
    isPending: boolean;
  };
}

export interface UsePaymentReturn {
  query: {
    cards: any[] | undefined;
    isLoading: boolean;
  };
  state: {
    showModal: boolean;
    deletingId: string | null;
    settingDefaultId: string | null;
  };
  actions: {
    openModal: () => void;
    closeModal: () => void;
    handleDelete: (id: string) => void;
    handleSetDefault: (id: string) => void;
  };
}
