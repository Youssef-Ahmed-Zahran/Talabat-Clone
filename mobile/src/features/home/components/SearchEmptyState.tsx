import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";
import { EmptyStateProps } from "../types/home.types";
export function SearchEmptyState({ query }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
      <Text className="text-lg font-bold text-textPrimary mt-4">
        No results found
      </Text>
      <Text className="text-sm text-textSecondary mt-1 text-center px-12">
        {`We couldn't find anything for "${query}". Try a different search.`}
      </Text>
    </View>
  );
}
