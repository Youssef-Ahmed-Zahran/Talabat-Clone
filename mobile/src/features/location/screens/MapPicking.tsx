import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useMapPicking } from "../hooks/useMapPicking";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@src/constants/theme";

export default function MapPickingScreen() {
  const { query, state, actions, refs } = useMapPicking();

  return (
    <View className="flex-1">
      <StatusBar style="dark" />
      <MapView
        ref={refs.mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={state.region}
        onPress={actions.handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        showsBuildings={true}
        showsPointsOfInterest={true}
        showsCompass={true}
        loadingEnabled={true}
      >
        {state.selected && (
          <Marker coordinate={state.selected} title="Delivery Point">
            <View className="items-center">
              <View className="bg-primary px-3 py-1.5 rounded-full mb-1 shadow-lg">
                <Text className="text-white text-[10px] font-black uppercase">
                  Drop here
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center border-4 border-white shadow-xl">
                <View className="w-2 h-2 rounded-full bg-white" />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Search Bar */}
      <SafeAreaView
        className="absolute top-0 left-0 right-0 z-10"
        edges={["top"]}
      >
        <View className="px-6 mt-4">
          <View className="flex-row items-center gap-x-3">
            <TouchableOpacity
              onPress={actions.handleConfirm}
              className="w-10 h-10 bg-white rounded-full items-center justify-center border border-border/40"
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-white rounded-xl h-12 px-3 border border-border/40">
              <Ionicons
                name="search-outline"
                size={18}
                color={COLORS.textTertiary}
              />
              <TextInput
                className="flex-1 text-sm text-textPrimary h-full ml-2"
                value={state.searchQuery}
                onChangeText={state.setSearchQuery}
                placeholder={`Search street or area in ${query.countryName || "your country"}...`}
                placeholderTextColor="#94A3B8"
                onSubmitEditing={actions.handleSearch}
                returnKeyType="search"
              />
              {state.searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={actions.handleSearch}
                  className="ml-2"
                >
                  <View className="bg-primary px-3 py-1.5 rounded-xl">
                    <Text className="text-white text-xs font-black">Go</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {query.countryName && (
            <View className="self-start bg-primary px-4 py-2 rounded-xl mt-3 shadow-lg shadow-primary/20">
              <Text className="text-white text-xs font-black uppercase tracking-widest">
                📍 {query.countryName}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* "Use My Current Location" Button */}
      <TouchableOpacity
        className="absolute right-6 bottom-[240px] bg-white rounded-2xl px-4 h-14 flex-row items-center justify-center shadow-2xl shadow-black/20 border border-border/10"
        onPress={actions.requestLocation}
        activeOpacity={0.9}
        disabled={state.locationLoading}
      >
        {state.locationLoading ? (
          <ActivityIndicator size="small" color="#FF6B00" />
        ) : (
          <>
            <Text className="text-lg mr-2">📍</Text>
            <Text className="text-sm font-black text-textPrimary">
              Use My Location
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Bottom Confirmation Sheet */}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[48px] shadow-2xl shadow-black/40">
        <View className="p-10 pt-8">
          <View className="w-12 h-1.5 bg-slate-100 rounded-full self-center mb-8" />

          <View className="mb-8">
            <Text className="text-xs font-black text-textTertiary uppercase tracking-[2px] mb-2 text-center">
              Your Delivery Point
            </Text>
            {state.selected ? (
              <Text
                className="text-lg font-black text-textPrimary text-center tracking-tight px-4"
                numberOfLines={2}
              >
                {state.addressLoading
                  ? "Finding address..."
                  : state.address ||
                    `${state.selected.latitude.toFixed(5)}, ${state.selected.longitude.toFixed(5)}`}
              </Text>
            ) : (
              <Text className="text-lg font-black text-textTertiary text-center tracking-tight opacity-50">
                Tap the map or search a street to pin your location
              </Text>
            )}
          </View>

          <TouchableOpacity
            className={`h-16 rounded-2xl justify-center items-center shadow-xl ${
              !state.selected ? "bg-slate-100" : "bg-primary shadow-primary/30"
            }`}
            onPress={actions.handleConfirm}
            disabled={!state.selected}
            activeOpacity={0.9}
          >
            <Text
              className={`text-xl font-black ${!state.selected ? "text-slate-400" : "text-white"}`}
            >
              Confirm Delivery Point
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
