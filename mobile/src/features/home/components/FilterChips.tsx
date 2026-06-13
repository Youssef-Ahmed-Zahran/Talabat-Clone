import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@src/constants/theme";

const FILTERS = [
  { id: "all", label: "All", icon: null },
  { id: "offers", label: "Offers", icon: "pricetag-outline" as const },
  { id: "free", label: "Free delivery", icon: "bicycle-outline" as const },
  { id: "fast", label: "Fast delivery", icon: "flash-outline" as const },
  { id: "pickup", label: "Pickup", icon: "bag-handle-outline" as const },
];

interface FilterChipsProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-3"
    >
      {FILTERS.map((filter) => {
        const active = selected === filter.id;
        return (
          <TouchableOpacity
            key={filter.id}
            onPress={() => onSelect(filter.id)}
            activeOpacity={0.8}
            className={`flex-row items-center px-4 py-2 rounded-full border ${
              active
                ? "bg-primary border-primary"
                : "bg-white border-border"
            }`}
          >
            {filter.icon && (
              <Ionicons
                name={filter.icon}
                size={14}
                color={active ? COLORS.white : COLORS.textSecondary}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              className={`text-sm font-semibold ${
                active ? "text-white" : "text-textPrimary"
              }`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
