import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '@src/constants/theme';

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  message,
  fullScreen = true,
  size = 'large',
  color = COLORS.primary,
}) => {
  if (!fullScreen) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size={size} color={color} />
        {message && <Text className="mt-3 text-sm text-textSecondary">{message}</Text>}
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-[#F5F5F5]">
      <View className="bg-white p-6 rounded-xl border border-border/40 items-center">
        <ActivityIndicator size={size} color={color} />
        {message && <Text className="mt-3 text-sm text-textPrimary font-medium">{message}</Text>}
      </View>
    </View>
  );
};
