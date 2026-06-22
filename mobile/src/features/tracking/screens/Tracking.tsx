import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Loader } from "@src/components/loader/Loader";
import { useTracking } from "../hooks/useTracking";
import { TrackingProgressBar } from "../components/TrackingProgressBar";
import { COLORS } from "@src/constants/theme";

export default function TrackingScreen() {
  const { query, coords, actions, router } = useTracking();

  if (query.trackLoading) return <Loader message="Locating your order..." />;

  return (
    <View className="flex-1">
      <StatusBar style="dark" />
      <MapView
        style={{ flex: 1 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: (coords.lat || coords.storeLat || 30.04) as number,
          longitude: (coords.lng || coords.storeLng || 31.23) as number,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
      >
        {coords.lat && coords.lng && (
          <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }}>
            <View className="bg-primary p-2 rounded-full border-2 border-white">
              <Ionicons name="bicycle" size={18} color={COLORS.white} />
            </View>
          </Marker>
        )}
        {coords.storeLat && coords.storeLng && (
          <Marker
            coordinate={{
              latitude: coords.storeLat as number,
              longitude: coords.storeLng as number,
            }}
          >
            <View className="bg-white p-2 rounded-lg border border-border/40">
              <Ionicons
                name="storefront"
                size={18}
                color={COLORS.textPrimary}
              />
            </View>
          </Marker>
        )}
        {coords.destLat && coords.destLng && (
          <Marker
            coordinate={{
              latitude: coords.destLat as number,
              longitude: coords.destLng as number,
            }}
          >
            <View className="bg-white p-2 rounded-lg border border-border/40">
              <Ionicons name="home" size={18} color={COLORS.primary} />
            </View>
          </Marker>
        )}
      </MapView>

      {query.isFinished && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={actions.handleFinishTracking}
          className="absolute inset-0 items-center justify-center bg-emerald-500/95"
        >
          <View className="items-center px-8">
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
              <Ionicons
                name="checkmark-circle"
                size={56}
                color={COLORS.white}
              />
            </View>
            <Text className="text-white text-2xl font-bold text-center">
              Order Delivered!
            </Text>
            <Text className="text-white/80 text-sm mt-2 text-center">
              Enjoy your meal
            </Text>
            <View className="mt-6 bg-white/20 px-5 py-2.5 rounded-xl">
              <Text className="text-white text-sm font-semibold">
                Returning home…
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <SafeAreaView className="absolute top-0 left-0 right-0" edges={["top"]}>
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={router.navigateBack}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-border/40"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View className="bg-white px-3 py-1.5 rounded-full border border-border/40">
            <Text className="text-xs font-semibold text-textPrimary">
              Order #{query.orderId?.slice(-6).toUpperCase()}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {!query.isFinished && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-4 pt-3 border-t border-border/40"
          style={{ paddingBottom: Platform.OS === "ios" ? 40 : 24 }}
        >
          <View className="w-10 h-1 bg-border rounded-full self-center mb-4" />

          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-3">
              <Text className="text-xs text-textTertiary mb-0.5">
                Coming from
              </Text>
              <Text
                className="text-base font-bold text-textPrimary"
                numberOfLines={1}
              >
                {query.order?.store?.name || "Store"}
              </Text>
            </View>
            {query.tracking?.estimatedArrival && (
              <View className="items-end">
                <Text className="text-xs text-textTertiary mb-0.5">ETA</Text>
                <Text className="text-base font-bold text-primary">
                  {new Date(query.tracking.estimatedArrival).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </View>
            )}
          </View>

          <View className="bg-primary/10 p-3 rounded-xl mb-4 border border-primary/10">
            <Text className="text-sm font-bold text-primary text-center">
              {query.STATUS_LABELS[query.currentStatus] ||
                query.currentStatus.replace(/_/g, " ")}
            </Text>
          </View>

          <TrackingProgressBar
            STATUS_STEPS={query.STATUS_STEPS}
            currentStep={query.currentStep}
          />

          <View className="flex-row gap-x-3 mt-4">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-[#F5F5F5] h-12 rounded-xl border border-border/40"
              onPress={router.navigateToChat}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text className="text-sm font-semibold text-textPrimary ml-1.5">
                Chat
              </Text>
            </TouchableOpacity>
            {query.tracking?.driver?.phone && (
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-primary h-12 rounded-xl"
                onPress={actions.handleCallDriver}
              >
                <Ionicons name="call-outline" size={18} color={COLORS.white} />
                <Text className="text-sm font-semibold text-white ml-1.5">
                  Call Driver
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
