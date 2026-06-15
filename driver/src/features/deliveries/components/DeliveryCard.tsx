import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Delivery } from '@features/deliveries/types/delivery.types';
import { COLORS } from '@constants/theme';

interface DeliveryCardProps {
  delivery: Delivery;
  onPress: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: COLORS.warning,  bg: '#FEF3C7' },
  accepted:   { label: 'Accepted',   color: COLORS.primary,  bg: '#FFF0E6' },
  picked_up:  { label: 'Picked Up',  color: COLORS.primary,  bg: '#FFF0E6' },
  on_the_way: { label: 'On the Way', color: '#3B82F6',       bg: '#DBEAFE' },
  delivered:  { label: 'Delivered',  color: COLORS.success,  bg: '#DCFCE7' },
  cancelled:  { label: 'Cancelled',  color: COLORS.danger,   bg: '#FEE2E2' },
};

export function DeliveryCard({ delivery, onPress }: DeliveryCardProps) {
  const cfg = STATUS_CONFIG[delivery.status] ?? STATUS_CONFIG.pending;

  return (
    <TouchableOpacity
      className="bg-surface rounded-2xl p-4 mb-3 border border-border"
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-textSecondary">
          #{delivery.orderId.slice(-6).toUpperCase()}
        </Text>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: cfg.bg }}
        >
          <Text className="text-xs font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* Store → Customer */}
      <View className="flex-row items-start mb-3 gap-2">
        <View className="items-center mt-1 gap-1">
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          <View className="w-0.5 h-6 bg-border" />
          <View className="w-2.5 h-2.5 rounded-full bg-success" />
        </View>
        <View className="flex-1 gap-2">
          <Text className="text-sm text-textPrimary font-medium" numberOfLines={1}>
            {delivery.store.name}
          </Text>
          <Text className="text-sm text-textSecondary" numberOfLines={1}>
            {delivery.deliveryAddress.street}, {delivery.deliveryAddress.city}
          </Text>
        </View>
      </View>

      {/* Footer: amount & distance */}
      <View className="flex-row items-center justify-between pt-3 border-t border-border">
        <View className="flex-row items-center gap-1">
          <Ionicons name="cash-outline" size={14} color={COLORS.textSecondary} />
          <Text className="text-sm text-textSecondary">
            Earn{' '}
            <Text className="font-bold text-textPrimary">
              ${delivery.deliveryFee.toFixed(2)}
            </Text>
          </Text>
        </View>
        {delivery.estimatedMinutes && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text className="text-sm text-textSecondary">
              ~{delivery.estimatedMinutes} min
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
