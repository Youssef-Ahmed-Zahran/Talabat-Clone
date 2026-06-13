import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@src/constants/theme';

export const NotFound: React.FC = () => {
  return (
    <View className="flex-1 justify-center items-center bg-[#F5F5F5] p-10">
      <Ionicons name="search-outline" size={56} color={COLORS.textTertiary} />
      <Text className="text-xl font-bold text-textPrimary mt-4 mb-1 text-center">
        Page Not Found
      </Text>
      <Text className="text-sm text-textSecondary text-center">
        The page you're looking for doesn't exist or has been moved.
      </Text>
    </View>
  );
};
