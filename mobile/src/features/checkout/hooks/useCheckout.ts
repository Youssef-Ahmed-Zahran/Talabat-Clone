import { useState, useEffect, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCart } from "@src/features/cart/api/cart.api";
import { usePlaceOrder } from "@src/features/orders/api/order.api";
import {
  useStorePaymentMethods,
  usePaymentMethods,
} from "@src/features/payment/api/payment.api";
import { useMyAddresses } from "@src/features/account/sub-features/address/api/address.api";
import { useLocationStore } from "@src/store/locationStore";
import { getErrorMessage } from "@src/utils/error";
import { UseCheckoutReturn } from "../types/checkout.types";

export function useCheckout(): UseCheckoutReturn {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const { defaultAddress } = useLocationStore();

  const { data: cart, isLoading: cartLoading } = useCart(storeId || "");
  const { data: storeMethods } = useStorePaymentMethods(storeId || "");
  const { data: globalMethods } = usePaymentMethods();
  const { data: addresses } = useMyAddresses();
  const placeOrder = usePlaceOrder();

  // Stable method list: store-specific first, then global fallback
  const methods = useMemo(
    () =>
      storeMethods && storeMethods.length > 0
        ? storeMethods
        : (globalMethods ?? []),
    [storeMethods, globalMethods],
  );

  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetTip = useCallback((amount: number) => {
    setIsCustom(false);
    setCustomTip("");
    setTipAmount(amount);
  }, []);

  const handleCustomTipChange = useCallback((val: string) => {
    setCustomTip(val);
    const parsed = parseFloat(val);
    setTipAmount(isNaN(parsed) || parsed < 0 ? 0 : parsed);
  }, []);

  // Sync selectedAddress whenever the defaultAddress from locationStore changes
  useEffect(() => {
    if (!addresses) return;

    // Check if the defaultAddress still exists in the fetched addresses
    const defaultExists = addresses.find((a) => a.id === defaultAddress?.id);

    if (defaultExists) {
      setSelectedAddress(defaultExists.id);
    } else if (addresses.length) {
      // Fallback: pick the default saved address or the first one
      const defaultSaved = addresses.find((a) => a.isDefault);
      const preferred = defaultSaved ?? addresses[0];
      setSelectedAddress(preferred.id);
    } else {
      setSelectedAddress("");
    }
  }, [defaultAddress, addresses]);

  // Auto-select first payment method
  useEffect(() => {
    if (methods.length > 0) {
      setSelectedPayment((prev) => prev || methods[0].id);
    }
  }, [methods]);

  // Derived totals
  const subtotal = (cart?.items || []).reduce((s: number, i: any) => {
    let itemTotal = Number(i.unitPrice) || 0;
    if (i.options) {
      i.options.forEach((opt: any) => {
        itemTotal += Number(opt.optionValue?.extraPrice) || 0;
      });
    }
    return s + itemTotal * i.quantity;
  }, 0);
  const deliveryFee = cart?.store?.deliveryFees || 0;
  const total = subtotal + deliveryFee + tipAmount;

  const navigateBack = useCallback(() => router.back(), [router]);
  const navigateToAddresses = useCallback(
    () => router.push("/account/addresses"),
    [router],
  );

  const handlePlaceOrder = useCallback(() => {
    if (!selectedAddress) {
      Alert.alert("Error", "Please select a delivery address");
      return;
    }
    if (!selectedPayment) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }
    placeOrder.mutate(
      {
        storeId: storeId || "",
        addressId: selectedAddress,
        paymentMethodId: selectedPayment,
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
      },
      {
        onSuccess: (order) => {
          if (order.deliveryType === "STORE_DELIVERY") {
            // Store handles its own delivery — go to order detail, not the live map
            router.replace({
              pathname: "/orders/detail",
              params: { orderId: order.id },
            });
          } else {
            router.replace({
              pathname: "/tracking/live",
              params: { orderId: order.id },
            });
          }
        },
        onError: (err) => Alert.alert("Order Failed", getErrorMessage(err)),
      },
    );
  }, [selectedAddress, selectedPayment, storeId, placeOrder, router]);

  // Resolve the full address object for the currently selected address
  const selectedAddressObj =
    defaultAddress?.id === selectedAddress
      ? defaultAddress
      : (addresses || []).find((a) => a.id === selectedAddress) ?? null;

  return {
    query: {
      storeId: storeId || "",
      cart,
      cartLoading,
      addresses,
      selectedAddressObj,
      methods,
    },
    state: {
      selectedPayment,
      setSelectedPayment,
      selectedAddress,
      setSelectedAddress,
      tipAmount,
      setTipAmount,
      customTip,
      isCustom,
      setIsCustom,
      handlePresetTip,
      handleCustomTipChange,
    },
    totals: {
      subtotal,
      deliveryFee,
      total,
    },
    actions: {
      handlePlaceOrder,
      isPlacingOrder: placeOrder.isPending,
    },
    router: {
      navigateBack,
      navigateToAddresses,
    },
  };
}
