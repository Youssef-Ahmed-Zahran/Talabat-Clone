import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@src/store/cartStore";
import { COLORS } from "@src/constants/theme";

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  icon,
  activeIcon,
  label,
  focused,
}: {
  icon: TabIconName;
  activeIcon: TabIconName;
  label: string;
  focused: boolean;
}) {
  return (
    <View className="items-center justify-center gap-y-1 min-w-[56px]">
      <Ionicons
        name={focused ? activeIcon : icon}
        size={24}
        color={focused ? COLORS.tabActive : COLORS.tabInactive}
      />
      <Text
        className={`text-[10px] font-medium text-center ${
          focused ? "text-primary font-semibold" : "text-textTertiary"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function CartTabIcon({ focused }: { focused: boolean }) {
  const itemCount = useCartStore((s) => s.itemCount);
  return (
    <View className="items-center justify-center gap-y-1 min-w-[56px]">
      <View className="relative">
        <Ionicons
          name={focused ? "bag" : "bag-outline"}
          size={24}
          color={focused ? COLORS.tabActive : COLORS.tabInactive}
        />
        {itemCount > 0 && (
          <View className="absolute -top-1.5 -right-2.5 bg-primary rounded-full min-w-[18px] h-[18px] justify-center items-center px-1 border-2 border-white">
            <Text className="text-white text-[10px] font-bold">
              {itemCount > 99 ? "99+" : itemCount}
            </Text>
          </View>
        )}
      </View>
      <Text
        className={`text-[10px] font-medium text-center ${
          focused ? "text-primary font-semibold" : "text-textTertiary"
        }`}
        numberOfLines={1}
      >
        Cart
      </Text>
    </View>
  );
}

function PayTabIcon({ focused }: { focused: boolean }) {
  return (
    <View className="items-center justify-center gap-y-1 min-w-[56px]">
      <View
        className={`w-6 h-6 rounded-md items-center justify-center ${
          focused ? "bg-primary" : "bg-surfaceAlt"
        }`}
      >
        <Ionicons
          name="wallet-outline"
          size={16}
          color={focused ? COLORS.white : COLORS.tabInactive}
        />
      </View>
      <Text
        className={`text-[10px] font-medium text-center ${
          focused ? "text-primary font-semibold" : "text-textTertiary"
        }`}
        numberOfLines={1}
      >
        Pay
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.divider,
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="home-outline"
              activeIcon="home"
              label="Home"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="receipt-outline"
              activeIcon="receipt"
              label="Orders"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          tabBarIcon: ({ focused }) => <PayTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="person-outline"
              activeIcon="person"
              label="Account"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
