import React from "react";
import { View, Text, Switch, ActivityIndicator } from "react-native";
import { useOnlineToggle } from "@features/home/hooks/useOnlineToggle";
import { COLORS } from "@constants/theme";

export function OnlineStatusBanner() {
  const {
    state: { isOnline },
    actions: { toggle, isPending },
  } = useOnlineToggle();

  const bg = isOnline ? COLORS.success : COLORS.secondary;

  return (
    <View
      className="mx-4 mt-4 rounded-2xl px-5 py-4 flex-row items-center justify-between"
      style={{ backgroundColor: bg }}
    >
      <View className="flex-row items-center gap-3">
        {/* Pulse dot */}
        <View
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isOnline
              ? "rgba(255,255,255,0.9)"
              : "rgba(255,255,255,0.4)",
          }}
        />
        <View>
          <Text className="text-white font-bold text-base">
            {isOnline ? "You are Online" : "You are Offline"}
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {isOnline ? "Accepting new orders" : "Go online to receive orders"}
          </Text>
        </View>
      </View>

      {isPending ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <Switch
          value={isOnline}
          onValueChange={toggle}
          disabled={isPending}
          trackColor={{
            false: "rgba(255,255,255,0.2)",
            true: "rgba(255,255,255,0.4)",
          }}
          thumbColor={COLORS.white}
          ios_backgroundColor="rgba(255,255,255,0.2)"
        />
      )}
    </View>
  );
}
