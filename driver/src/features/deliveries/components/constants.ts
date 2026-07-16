import { DeliveryStatus } from "../api/deliveries.api";
import { COLORS } from "@constants/theme";

export const NEXT_STATUS: Record<
  string,
  { label: string; next: DeliveryStatus; icon: string; color: string }
> = {
  CONFIRMED: {
    label: "Arrived at Store",
    next: "READY_FOR_PICKUP",
    icon: "storefront-outline",
    color: COLORS.primary,
  },
  PREPARING: {
    label: "Arrived at Store",
    next: "READY_FOR_PICKUP",
    icon: "storefront-outline",
    color: COLORS.primary,
  },
  READY_FOR_PICKUP: {
    label: "Picked Up Order",
    next: "PICKED_UP",
    icon: "bag-check-outline",
    color: COLORS.primary,
  },
  PICKED_UP: {
    label: "Start Delivery",
    next: "ON_THE_WAY",
    icon: "navigate-outline",
    color: "#3B82F6",
  },
  ON_THE_WAY: {
    label: "Confirm Delivered",
    next: "DELIVERED",
    icon: "flag-outline",
    color: COLORS.success,
  },
};

export const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "🏍️ Heading to store",
  PREPARING: "👨‍🍳 Store is preparing",
  READY_FOR_PICKUP: "📦 Ready for pickup",
  PICKED_UP: "📦 Order picked up",
  ON_THE_WAY: "🚀 On the way to customer",
  DELIVERED: "✅ Delivered",
};
