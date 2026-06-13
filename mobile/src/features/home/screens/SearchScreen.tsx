import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { StoreResult } from "../components/StoreResult";
import { ProductResult } from "../components/ProductResult";
import { SearchEmptyState } from "../components/SearchEmptyState";
import { useSearchScreen } from "../hooks/useSearchScreen";
import { COLORS } from "@src/constants/theme";

export default function SearchScreen() {
  const {
    query: searchQuery,
    filters,
    actions,
    refs,
    router,
    history,
  } = useSearchScreen();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <View className="bg-white px-4 py-3 border-b border-[#E5E5E5]">
        <View className="flex-row items-center gap-x-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[#F5F5F5] items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-[#F5F5F5] rounded-xl px-3 h-11">
            <Ionicons
              name="search-outline"
              size={18}
              color={COLORS.textTertiary}
            />
            <TextInput
              ref={refs.inputRef}
              autoFocus
              value={filters.rawQuery}
              onChangeText={filters.setRawQuery}
              placeholder="Restaurants, food, dishes..."
              placeholderTextColor={COLORS.textTertiary}
              className="flex-1 text-sm text-textPrimary ml-2 text-left"
              returnKeyType="search"
              clearButtonMode="while-editing"
              onSubmitEditing={() => actions.addRecentSearch(filters.rawQuery)}
            />
            {(searchQuery.isLoading || searchQuery.isFetching) &&
              filters.rawQuery.length >= 2 && (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
          </View>
        </View>

        {searchQuery.data &&
          (searchQuery.stores.length > 0 ||
            searchQuery.products.length > 0) && (
            <View className="flex-row gap-x-2 mt-3">
              {(["all", "stores", "products"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => filters.setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full border ${
                    filters.activeTab === tab
                      ? "bg-primary border-primary"
                      : "bg-white border-[#E5E5E5]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      filters.activeTab === tab
                        ? "text-white"
                        : "text-textSecondary"
                    }`}
                  >
                    {tab === "all"
                      ? "All"
                      : tab === "stores"
                        ? `Stores (${searchQuery.stores.length})`
                        : `Items (${searchQuery.products.length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
      </View>

      {filters.rawQuery.length < 2 &&
        (history.recentSearches.length > 0 ? (
          <ScrollView
            className="flex-1 px-4 pt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-bold text-textPrimary">
                  Recent Searches
                </Text>
                <TouchableOpacity onPress={actions.clearRecentSearches}>
                  <Text className="text-xs text-primary font-bold">
                    Clear all
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {history.recentSearches.map((term, index) => (
                  <View
                    key={index}
                    className="flex-row items-center bg-white border border-[#E5E5E5] rounded-full px-3 py-1.5"
                  >
                    <TouchableOpacity
                      onPress={() => {
                        filters.setRawQuery(term);
                        actions.addRecentSearch(term);
                      }}
                    >
                      <Text className="text-xs text-textSecondary mr-1.5">
                        {term}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => actions.removeRecentSearch(term)}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={COLORS.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons
              name="search-outline"
              size={56}
              color={COLORS.textTertiary}
            />
            <Text className="text-lg font-bold text-textPrimary mt-4">
              Find anything
            </Text>
            <Text className="text-sm text-textSecondary mt-1 text-center px-12">
              Search for restaurants, cuisines, or specific dishes
            </Text>
          </View>
        ))}

      {searchQuery.showEmpty && <SearchEmptyState query={filters.rawQuery} />}

      {searchQuery.listData.length > 0 && (
        <FlatList
          data={searchQuery.listData}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item.type === "section_header") {
              return (
                <Text className="text-xs font-semibold text-textTertiary uppercase mb-2 mt-1">
                  {item.title}
                </Text>
              );
            }
            if (item.type === "store") {
              return (
                <StoreResult
                  store={item.item}
                  onPress={() => actions.handleStorePress(item.item.id)}
                />
              );
            }
            return (
              <ProductResult
                product={item.item}
                onPress={() => actions.handleProductPress(item.item.storeId)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
