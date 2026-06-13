import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

interface SubCategoryFilterProps {
  subCategories: any[];
  selectedSubCategory: string | null;
  onSelect: (id: string | null) => void;
}

const getSubCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (
    lower.includes("drink") ||
    lower.includes("مشروب") ||
    lower.includes("عصير") ||
    lower.includes("قهوة")
  ) {
    return "cafe-outline";
  }
  if (
    lower.includes("sweet") ||
    lower.includes("حلو") ||
    lower.includes("حلويات") ||
    lower.includes("كيك")
  ) {
    return "ice-cream-outline";
  }
  if (
    lower.includes("international") ||
    lower.includes("عالمي") ||
    lower.includes("أطباق") ||
    lower.includes("مشويات")
  ) {
    return "restaurant-outline";
  }
  return "fast-food-outline";
};

export function SubCategoryFilter({
  subCategories,
  selectedSubCategory,
  onSelect,
}: SubCategoryFilterProps) {
  return (
    <View className="bg-white border-b border-[#E8E8E8]/40 pb-4 pt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          flexDirection: "row",
          gap: 12,
        }}
      >
        {/* Show all / All */}
        <TouchableOpacity
          onPress={() => onSelect(null)}
          className="items-center w-[74px]"
          activeOpacity={0.8}
        >
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-1.5 border-2 ${selectedSubCategory === null ? "border-primary bg-primary/5" : "border-border/60 bg-white"}`}
          >
            <Ionicons
              name="grid"
              size={26}
              color={
                selectedSubCategory === null
                  ? COLORS.primary
                  : COLORS.textSecondary
              }
            />
          </View>
          <Text
            className={`text-[11px] font-bold text-center ${selectedSubCategory === null ? "text-primary" : "text-textPrimary"}`}
            numberOfLines={1}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Dynamic subcategories */}
        {(subCategories || []).map((sub: any) => (
          <TouchableOpacity
            key={sub.id}
            onPress={() => onSelect(sub.id)}
            className="items-center w-[74px]"
            activeOpacity={0.8}
          >
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-1.5 border-2 ${selectedSubCategory === sub.id ? "border-primary bg-primary/5" : "border-border/60 bg-white"}`}
            >
              {sub.imageUrl ? (
                <Image
                  source={{ uri: sub.imageUrl }}
                  className="w-12 h-12 rounded-full"
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name={getSubCategoryIcon(sub.name)}
                  size={26}
                  color={
                    selectedSubCategory === sub.id
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                />
              )}
            </View>
            <Text
              className={`text-[11px] font-bold text-center ${selectedSubCategory === sub.id ? "text-primary" : "text-textPrimary"}`}
              numberOfLines={1}
            >
              {sub.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
