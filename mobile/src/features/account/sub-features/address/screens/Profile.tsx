import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  useMyAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "../api/address.api";
import { Loader } from "@src/components/loader/Loader";
import type { UserAddress } from "@src/features/location/types/address.types";
import { StatusBar } from "expo-status-bar";
import { useLocationStore } from "@src/store/locationStore";

export default function AddressListScreen() {
  const router = useRouter();
  const { data: addresses, isLoading } = useMyAddresses();
  const deleteAddr = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to remove this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAddr.mutate(id),
        },
      ],
    );
  };

  const setDefaultAddressLocal = useLocationStore((s) => s.setDefaultAddress);

  const handleSelect = async (item: UserAddress) => {
    await setDefaultAddressLocal(item);
    if (router.canGoBack()) {
      router.back();
    }
  };

  const renderAddress = ({ item }: { item: UserAddress }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleSelect(item)}
      className="bg-white rounded-[32px] p-6 mb-4 shadow-xl shadow-black/[0.03] border border-border/40"
    >
      <View className="flex-row items-center mb-6">
        <View className="w-12 h-12 rounded-2xl bg-surfaceAlt items-center justify-center border border-border/20 mr-4">
          <Text className="text-2xl">
            {item.type === "APARTMENT"
              ? "🏢"
              : item.type === "VILLA"
                ? "🏡"
                : "🏛️"}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-lg font-black text-textPrimary tracking-tight">
              {item.label || item.type}
            </Text>
            {item.isDefault && (
              <View className="bg-primary/10 px-2 py-0.5 rounded-lg ml-3">
                <Text className="text-[10px] font-black text-primary uppercase">
                  Default
                </Text>
              </View>
            )}
          </View>
          <Text
            className="text-sm font-medium text-textTertiary mt-0.5"
            numberOfLines={1}
          >
            {item.street || "No street specified"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-end gap-x-6 pt-5 border-t border-border/20">
        {!item.isDefault && (
          <TouchableOpacity
            onPress={() => {
              setDefault.mutate(item.id);
              setDefaultAddressLocal(item);
            }}
            className="flex-row items-center"
          >
            <Text className="text-sm font-black text-primary uppercase tracking-widest">
              Set Default
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          className="flex-row items-center"
        >
          <Text className="text-sm font-black text-error uppercase tracking-widest">
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <Loader message="Fetching your addresses..." />;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]" edges={["top"]}>
      <StatusBar style="dark" />
      <View className="flex-row items-center px-8 py-6 bg-white border-b border-border/50">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl font-bold text-textPrimary">←</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-black text-textPrimary tracking-tight">
          Saved Addresses
        </Text>
      </View>

      <FlatList
        data={addresses || []}
        keyExtractor={(i) => i.id}
        renderItem={renderAddress}
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-24 h-24 bg-primary/5 rounded-full items-center justify-center mb-8">
              <Text className="text-5xl">📍</Text>
            </View>
            <Text className="text-2xl font-black text-textPrimary tracking-tight">
              No saved addresses
            </Text>
            <Text className="text-base text-textSecondary mt-3 text-center px-10 leading-relaxed">
              Add your delivery addresses to make checkout faster next time.
            </Text>
          </View>
        }
      />

      <View className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-white/80 backdrop-blur-md">
        <TouchableOpacity
          className="bg-primary h-16 rounded-2xl justify-center items-center shadow-xl shadow-primary/30"
          onPress={() => router.push("/location/country-select")}
          activeOpacity={0.9}
        >
          <Text className="text-xl font-black text-white">Add New Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
