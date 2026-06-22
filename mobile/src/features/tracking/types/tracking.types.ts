import { Message } from "./messaging.types";
import { FlatList } from "react-native";
// ============================================================
// Tracking Types
// ============================================================

export interface TrackingData {
  orderId: string;
  status: string;
  driverLatitude: number | null;
  driverLongitude: number | null;
  estimatedArrival: string | null;
  storeLatitude: number;
  storeLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  driver?: {
    id: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  order?: {
    id: string;
    status: string;
    store: {
      name: string;
      latitude: number;
      longitude: number;
    };
    address: {
      latitude: number;
      longitude: number;
      label: string | null;
    };
  };
}

export interface DriverLocationUpdate {
  driverId: string;
  orderId: string;
  latitude: number;
  longitude: number;
}

export interface MessageBubbleProps {
  body: string;
  createdAt: string;
  isMe: boolean;
}

export interface TrackingProgressBarProps {
  STATUS_STEPS: string[];
  currentStep: number;
}

export interface UseChatReturn {
  query: {
    orderId: string;
    userId: string | undefined;
    messages: Message[];
  };
  state: {
    text: string;
    isConnecting: boolean;
    connectError: string | null;
    isSending: boolean;
    isTyping: boolean;
  };
  actions: {
    setText: (v: string) => void;
    handleTyping: (val: string) => void;
    handleSend: () => void;
  };
  refs: {
    flatListRef: React.RefObject<FlatList | null>;
  };
  router: {
    navigateBack: () => void;
  };
}

export interface UseTrackingReturn {
  query: {
    orderId: string;
    order: any;
    tracking: any;
    trackLoading: boolean;
    currentStatus: string;
    currentStep: number;
    STATUS_STEPS: string[];
    STATUS_LABELS: Record<string, string>;
    isFinished: boolean;
  };
  coords: {
    lat: number | null;
    lng: number | null;
    driverLat: number | null;
    driverLng: number | null;
    storeLat: number | undefined;
    storeLng: number | undefined;
    destLat: number | undefined;
    destLng: number | undefined;
  };
  actions: {
    handleCallDriver: () => Promise<void>;
    handleFinishTracking: () => void;
  };
  router: {
    navigateBack: () => void;
    navigateToChat: () => void;
  };
}
