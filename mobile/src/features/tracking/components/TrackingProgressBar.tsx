import React from "react";
import { View, Text } from "react-native";

interface TrackingProgressBarProps {
  STATUS_STEPS: string[];
  currentStep: number;
}

export function TrackingProgressBar({
  STATUS_STEPS,
  currentStep,
}: TrackingProgressBarProps) {
  return (
    <View className="flex-row items-center justify-between mb-8">
      {STATUS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View
            className={`w-3 h-3 rounded-full ${i <= currentStep ? "bg-primary" : "bg-slate-200"}`}
          />
          {i < STATUS_STEPS.length - 1 && (
            <View
              className={`flex-1 h-1 mx-0.5 rounded-full ${i < currentStep ? "bg-primary" : "bg-slate-100"}`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
