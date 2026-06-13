import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product, OptionGroup } from "@src/features/stores/types/store.types";
import { useAddToCart, useClearCart } from "@src/features/cart/api/cart.api";
import { getErrorMessage } from "@src/utils/error";
import { COLORS } from "@src/constants/theme";

interface ProductOptionsModalProps {
  visible: boolean;
  product: Product | null;
  storeId: string;
  onClose: () => void;
}

export const ProductOptionsModal: React.FC<ProductOptionsModalProps> = ({
  visible,
  product,
  storeId,
  onClose,
}) => {
  const addToCart = useAddToCart();
  const clearCart = useClearCart();
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (visible && product) {
      setSelectedOptions({});
      setQuantity(1);
    }
  }, [visible, product]);

  if (!product) return null;

  const handleToggleOption = (
    groupId: string,
    valueId: string,
    isRadio: boolean,
  ) => {
    setSelectedOptions((prev) => {
      const currentSelections = prev[groupId] || [];
      if (isRadio) return { ...prev, [groupId]: [valueId] };
      if (currentSelections.includes(valueId)) {
        return {
          ...prev,
          [groupId]: currentSelections.filter((id) => id !== valueId),
        };
      }
      return { ...prev, [groupId]: [...currentSelections, valueId] };
    });
  };

  const isGroupValid = (group: OptionGroup) => {
    const selectedCount = (selectedOptions[group.id] || []).length;
    if (group.isRequired && selectedCount < (group.minSelect || 1))
      return false;
    return true;
  };

  const isFormValid = product.optionGroups?.every(isGroupValid) ?? true;

  let totalPrice = product.price * quantity;
  product.optionGroups?.forEach((group) => {
    const selections = selectedOptions[group.id] || [];
    group.values.forEach((val) => {
      if (selections.includes(val.id)) totalPrice += val.extraPrice * quantity;
    });
  });

  const handleAdd = () => {
    if (!isFormValid || !product) return;
    const allSelectedIds = Object.values(selectedOptions).flat();

    const reqData = {
      storeId,
      productId: product.id,
      quantity,
      selectedOptions: allSelectedIds,
    };

    addToCart.mutate(reqData, {
      onSuccess: () => {
        Alert.alert("Added!", "Item added to cart");
        onClose();
      },
      onError: (err: any) => {
        if (err?.response?.status === 409) {
          const existingCartId =
            err?.response?.data?.errors?.[0]?.existingCartId;
          Alert.alert(
            "Clear Cart?",
            err?.response?.data?.message ||
              "You have items from another store.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Clear & Add",
                style: "destructive",
                onPress: () => {
                  if (existingCartId) {
                    clearCart.mutate(existingCartId, {
                      onSuccess: () => {
                        addToCart.mutate(reqData, {
                          onSuccess: () => {
                            Alert.alert("Added!", "Item added to cart");
                            onClose();
                          },
                          onError: (retryErr) =>
                            Alert.alert("Error", getErrorMessage(retryErr)),
                        });
                      },
                      onError: (clearErr) =>
                        Alert.alert("Error", getErrorMessage(clearErr)),
                    });
                  } else {
                    Alert.alert(
                      "Error",
                      "Could not find existing cart to clear.",
                    );
                  }
                },
              },
            ],
          );
        } else {
          Alert.alert("Error", getErrorMessage(err));
        }
      },
    });
  };

  const hasImages = product.images && product.images.length > 0;
  const primaryImage = product.imageUrl;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-2xl max-h-[90%]">
          {/* Header & Product Info */}
          <View className="px-4 py-4 border-b border-border/40">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 mr-3">
                <Text className="text-lg font-bold text-textPrimary">
                  {product.name}
                </Text>
                <Text className="text-base font-bold text-primary mt-1">
                  {product.price.toFixed(2)} EGP
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-[#F5F5F5] items-center justify-center"
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {product.description ? (
              <Text className="text-sm text-textSecondary mb-4 leading-relaxed">
                {product.description}
              </Text>
            ) : null}

            {hasImages ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2"
                contentContainerStyle={{ gap: 8 }}
                snapToInterval={264} // 256 (w-64) + 8 (gap)
                decelerationRate="fast"
              >
                {product.images!.map((imgUrl, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: imgUrl }}
                    className="w-64 h-48 rounded-xl bg-gray-100"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : primaryImage ? (
              <Image
                source={{ uri: primaryImage }}
                className="w-full h-48 rounded-xl bg-gray-100 mb-2"
                resizeMode="cover"
              />
            ) : null}
          </View>

          <ScrollView
            className="px-4 pt-4"
            showsVerticalScrollIndicator={false}
          >
            {product.optionGroups?.map((group) => {
              const isRadio = group.maxSelect === 1;
              const selectedCount = (selectedOptions[group.id] || []).length;
              const hasError =
                group.isRequired && selectedCount < (group.minSelect || 1);

              return (
                <View key={group.id} className="mb-6">
                  <View className="flex-row justify-between items-end mb-3">
                    <View>
                      <Text className="text-sm font-bold text-textPrimary">
                        {group.name}
                        {group.isRequired && (
                          <Text className="text-primary"> *</Text>
                        )}
                      </Text>
                      <Text className="text-xs text-textTertiary mt-0.5">
                        {isRadio
                          ? "Select one"
                          : `Select at least ${group.minSelect || 1}`}
                      </Text>
                    </View>
                    {hasError && (
                      <View className="bg-error/10 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-semibold text-error">
                          Required
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="gap-y-2">
                    {group.values.map((val) => {
                      const isSelected = (
                        selectedOptions[group.id] || []
                      ).includes(val.id);
                      return (
                        <TouchableOpacity
                          key={val.id}
                          className={`flex-row justify-between items-center p-3 rounded-xl border ${
                            isSelected
                              ? "bg-primary/5 border-primary/50"
                              : "bg-[#F5F5F5] border-border/40"
                          }`}
                          onPress={() =>
                            handleToggleOption(group.id, val.id, isRadio)
                          }
                          activeOpacity={0.7}
                        >
                          <View className="flex-1 mr-3">
                            <Text
                              className={`text-sm font-semibold ${
                                isSelected ? "text-primary" : "text-textPrimary"
                              }`}
                            >
                              {val.name}
                            </Text>
                            {val.extraPrice > 0 && (
                              <Text className="text-xs text-textTertiary mt-0.5">
                                + {val.extraPrice} EGP
                              </Text>
                            )}
                          </View>
                          <View
                            className={`w-5 h-5 items-center justify-center border-2 ${
                              isRadio ? "rounded-full" : "rounded-md"
                            } ${isSelected ? "bg-primary border-primary" : "bg-white border-border/60"}`}
                          >
                            {isSelected &&
                              (isRadio ? (
                                <View className="w-2 h-2 rounded-full bg-white" />
                              ) : (
                                <Ionicons
                                  name="checkmark"
                                  size={12}
                                  color={COLORS.white}
                                />
                              ))}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            <View className="h-6" />
          </ScrollView>

          <View className="px-4 pt-4 pb-8 bg-white border-t border-border/40">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center bg-[#F5F5F5] rounded-lg p-0.5">
                <TouchableOpacity
                  className="w-9 h-9 rounded-md items-center justify-center bg-white"
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={COLORS.textPrimary}
                  />
                </TouchableOpacity>
                <Text className="mx-4 text-base font-bold text-textPrimary">
                  {quantity}
                </Text>
                <TouchableOpacity
                  className="w-9 h-9 rounded-md items-center justify-center bg-primary"
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Ionicons name="add" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <View className="items-end">
                <Text className="text-xs text-textTertiary">Total</Text>
                <Text className="text-xl font-bold text-primary">
                  {totalPrice.toFixed(2)} EGP
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className={`h-12 rounded-xl justify-center items-center ${
                !isFormValid || addToCart.isPending
                  ? "bg-slate-200"
                  : "bg-primary"
              }`}
              onPress={handleAdd}
              disabled={!isFormValid || addToCart.isPending}
              activeOpacity={0.9}
            >
              {addToCart.isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text
                  className={`text-base font-bold ${
                    !isFormValid ? "text-slate-400" : "text-white"
                  }`}
                >
                  Add to Cart
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
