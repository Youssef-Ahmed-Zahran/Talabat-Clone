import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Order } from "@src/features/orders/types/order.types";
import { useLocationStore } from "@src/store/locationStore";
import { COLORS } from "@src/constants/theme";

import { STATUS_CONFIG, StatusBadge } from "./StatusBadge";

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface OrderCardProps {
  item: Order;
  isReordering: boolean;
  onTrack: () => void;
  onReorder: () => void;
  onReview: () => void;
}

export function OrderCard({
  item,
  onTrack,
  onReorder,
  onReview,
  isReordering,
}: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { selectedLatitude, selectedLongitude } = useLocationStore();

  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
  const isActive = !["DELIVERED", "CANCELLED"].includes(item.status);
  const items = item.items ?? [];

  const storeLat = item.store?.latitude ? Number(item.store.latitude) : null;
  const storeLng = item.store?.longitude ? Number(item.store.longitude) : null;
  const maxDistance =
    item.store?.maxDeliveryDistanceKm !== undefined &&
    item.store?.maxDeliveryDistanceKm !== null
      ? Number(item.store.maxDeliveryDistanceKm)
      : 15;

  let isOutsideZone = false;
  if (
    selectedLatitude !== null &&
    selectedLongitude !== null &&
    storeLat !== null &&
    storeLng !== null
  ) {
    const dist = haversine(
      selectedLatitude,
      selectedLongitude,
      storeLat,
      storeLng,
    );
    if (dist > maxDistance) {
      isOutsideZone = true;
    }
  }

  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View className="bg-white rounded-xl mb-3 border border-border/40 overflow-hidden">
      {/* Active status banner */}
      {isActive &&
        (item.deliveryType === "STORE_DELIVERY" ? (
          <View className="bg-amber-50 border-b border-amber-100 px-5 py-2 flex-row items-center">
            <View className={`w-2 h-2 rounded-full ${status.dot} mr-2`} />
            <Text className="text-xs font-bold text-amber-700">
              {status.label}
            </Text>
            <Text className="text-xs text-textTertiary ml-2">
              • {formattedDate}
            </Text>
          </View>
        ) : (
          <View className="bg-primary/5 border-b border-primary/10 px-5 py-2 flex-row items-center">
            <View className={`w-2 h-2 rounded-full ${status.dot} mr-2`} />
            <Text className="text-xs font-bold text-primary">
              {status.label}
            </Text>
            <Text className="text-xs text-textTertiary ml-2">
              • {formattedDate}
            </Text>
          </View>
        ))}

      {/* Header row (tap to expand) */}
      <TouchableOpacity
        className="flex-row items-center p-5"
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        {/* Store logo */}
        <View className="w-14 h-14 rounded-2xl bg-surfaceAlt items-center justify-center overflow-hidden border border-border/20 mr-4">
          {item.store?.logoUrl ? (
            <Image
              source={{ uri: item.store.logoUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="storefront-outline"
              size={24}
              color={COLORS.textTertiary}
            />
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text
            className="text-base font-bold text-textPrimary"
            numberOfLines={1}
          >
            {item.store?.name || "Store"}
          </Text>
          <Text className="text-xs text-textTertiary mt-0.5">
            {items.length} {items.length === 1 ? "item" : "items"}
            {!isActive && ` • ${formattedDate}`}
          </Text>
          {!expanded && items.length > 0 && (
            <Text className="text-xs text-textSecondary mt-1" numberOfLines={1}>
              {items
                .map((i: any) => `${i.quantity}× ${i.name_snapshot}`)
                .join(", ")}
            </Text>
          )}
        </View>

        {/* Status badge / chevron */}
        <View className="items-end ml-2">
          {!isActive && <StatusBadge status={item.status} />}
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={COLORS.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded: item list + price breakdown */}
      {expanded && (
        <View className="px-5 pb-2 border-t border-border/20">
          <Text className="text-xs font-semibold text-textTertiary uppercase pt-4 pb-3">
            Order Details
          </Text>

          {items.length > 0 ? (
            items.map((orderItem: any, idx: number) => {
              const itemTotal =
                Number(orderItem.price_snapshot) * orderItem.quantity;
              return (
                <View
                  key={idx}
                  className="flex-row justify-between items-center mb-3"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-3">
                      <Text className="text-[10px] font-bold text-primary">
                        {orderItem.quantity}×
                      </Text>
                    </View>
                    <Text
                      className="text-sm font-semibold text-textPrimary flex-1"
                      numberOfLines={2}
                    >
                      {orderItem.name_snapshot}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-textPrimary">
                    {itemTotal.toFixed(2)} EGP
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="text-sm text-textTertiary mb-3">
              No item details available.
            </Text>
          )}

          {/* Price breakdown */}
          <View className="border-t border-border/20 mt-2 pt-4 mb-4 gap-y-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-textSecondary">Subtotal</Text>
              <Text className="text-sm font-semibold text-textPrimary">
                {Number(item.subtotal ?? 0).toFixed(2)} EGP
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-textSecondary">Delivery</Text>
              <Text className="text-sm font-semibold text-textPrimary">
                {Number(item.deliveryFees ?? 0) === 0
                  ? "Free"
                  : `${Number(item.deliveryFees).toFixed(2)} EGP`}
              </Text>
            </View>
            {Number(item.tipAmount ?? 0) > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-textSecondary">Tip</Text>
                <Text className="text-sm font-semibold text-textPrimary">
                  {Number(item.tipAmount).toFixed(2)} EGP
                </Text>
              </View>
            )}
            <View className="flex-row justify-between pt-2 border-t border-border/20">
              <Text className="text-base font-bold text-textPrimary">
                Total
              </Text>
              <Text className="text-base font-bold text-primary">
                {Number(item.totalAmount ?? 0).toFixed(2)} EGP
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Footer actions */}
      <View className="flex-row border-t border-border/20">
        {isActive && item.deliveryType !== "STORE_DELIVERY" ? (
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-4 bg-primary/5"
            onPress={onTrack}
            activeOpacity={0.8}
          >
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-sm font-bold text-primary">Track Live</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={COLORS.primary}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        ) : isActive && item.deliveryType === "STORE_DELIVERY" ? (
          // Store handles its own delivery — no live GPS tracking (like real Talabat)
          <View className="flex-1 flex-row items-center justify-center py-4 bg-amber-50">
            <Ionicons name="storefront-outline" size={16} color="#B45309" />
            <Text className="text-sm font-bold text-amber-700 ml-1.5">
              Store Delivery
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              className="flex-1 items-center justify-center py-4"
              onPress={() => setExpanded(!expanded)}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-bold text-textSecondary">
                {expanded ? "Hide Details" : "View Details"}
              </Text>
            </TouchableOpacity>
            <View className="w-px bg-border/30" />
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center py-4 ${isReordering || items.length === 0 || isOutsideZone ? "opacity-50" : ""}`}
              onPress={onReorder}
              disabled={isReordering || items.length === 0 || isOutsideZone}
              activeOpacity={0.8}
            >
              <Text
                className={`text-sm font-bold mr-1 ${items.length === 0 || isOutsideZone ? "text-textTertiary" : "text-primary"}`}
              >
                {isOutsideZone ? "Outside Zone" : "Order Again"}
              </Text>
              {!isOutsideZone && (
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={
                    items.length === 0 ? COLORS.textTertiary : COLORS.primary
                  }
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>

            {item.status === "DELIVERED" && (
              <>
                <View className="w-px bg-border/30" />
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center py-4"
                  onPress={onReview}
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-bold text-primary mr-1">
                    Review
                  </Text>
                  <Ionicons name="star" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}
