import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@constants/theme';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export function Loader({ size = 'large', color = COLORS.primary }: LoaderProps) {
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
