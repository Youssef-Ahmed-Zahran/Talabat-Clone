import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DriverStats } from '@features/home/api/home.api';
import { COLORS } from '@constants/theme';

interface StatsCardProps {
  stats: DriverStats;
}

interface StatItemProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <View className="flex-1 bg-surface rounded-2xl p-4 border border-border items-center">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-xl font-bold text-textPrimary">{value}</Text>
      <Text className="text-xs text-textSecondary mt-0.5 text-center">{label}</Text>
    </View>
  );
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <View className="mx-4 mt-4">
      <Text className="text-xs font-semibold text-textTertiary uppercase mb-3">Today</Text>
      <View className="flex-row gap-3 mb-3">
        <StatItem
          icon="bicycle-outline"
          label="Deliveries"
          value={String(stats.todayDeliveries)}
          color={COLORS.primary}
        />
        <StatItem
          icon="cash-outline"
          label="Earnings"
          value={`$${stats.todayEarnings.toFixed(2)}`}
          color={COLORS.success}
        />
        <StatItem
          icon="star-outline"
          label="Rating"
          value={stats.rating.toFixed(1)}
          color={COLORS.warning}
        />
      </View>
      <Text className="text-xs font-semibold text-textTertiary uppercase mb-3">This Week</Text>
      <View className="flex-row gap-3">
        <StatItem
          icon="bicycle-outline"
          label="Deliveries"
          value={String(stats.weekDeliveries)}
          color={COLORS.primary}
        />
        <StatItem
          icon="cash-outline"
          label="Earnings"
          value={`$${stats.weekEarnings.toFixed(2)}`}
          color={COLORS.success}
        />
        <StatItem
          icon="trophy-outline"
          label="All Time"
          value={String(stats.totalDeliveries)}
          color="#8B5CF6"
        />
      </View>
    </View>
  );
}
