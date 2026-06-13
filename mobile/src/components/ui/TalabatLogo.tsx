import React from "react";
import { Text, View } from "react-native";

interface TalabatLogoProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "orange";
}

const SIZES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function TalabatLogo({
  size = "md",
  color = "orange",
}: TalabatLogoProps) {
  return (
    <View>
      <Text
        className={`${SIZES[size]} font-black tracking-tight ${
          color === "white" ? "text-white" : "text-primary"
        }`}
      >
        talabat
      </Text>
    </View>
  );
}
