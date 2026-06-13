import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

interface SearchBarProps {
  onPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onPress }) => {
  const router = useRouter();
  const handlePress = () => {
    onPress?.();
    router.push("/search");
  };

  return (
    <TouchableOpacity
      className="flex-row items-center bg-[#F5F5F5] mx-4 h-12 rounded-xl px-4"
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Ionicons name="search-outline" size={20} color={COLORS.textTertiary} />
      <Text className="text-sm text-textTertiary font-medium ml-3 flex-1">
        Search for restaurants, groceries...
      </Text>
    </TouchableOpacity>
  );
};
