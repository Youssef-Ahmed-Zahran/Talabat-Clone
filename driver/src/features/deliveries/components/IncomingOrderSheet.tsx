import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUIStore } from '@store/uiStore';
import { useAcceptDelivery, useRejectDelivery } from '@features/deliveries/api/deliveries.api';
import { COLORS } from '@constants/theme';
import { getErrorMessage } from '@utils/error';
import { dispatchSocket } from '@config/socket';

// Auto-reject countdown matches server's DISPATCH_TIMEOUT_SEC (60s)
const TIMEOUT_SEC = 55;

export function IncomingOrderSheet() {
  const router = useRouter();
  const isOpen = useUIStore((s) => s.isIncomingOrderSheetOpen);
  const incomingOrder = useUIStore((s) => s.incomingOrder);
  const setIncomingOrderSheetOpen = useUIStore((s) => s.setIncomingOrderSheetOpen);
  const setIncomingOrder = useUIStore((s) => s.setIncomingOrder);

  const { mutateAsync: accept, isPending: isAccepting } = useAcceptDelivery();
  const { mutateAsync: reject, isPending: isRejecting } = useRejectDelivery();

  const [countdown, setCountdown] = useState(TIMEOUT_SEC);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slide up when opened
  useEffect(() => {
    if (isOpen) {
      setCountdown(TIMEOUT_SEC);
      Vibration.vibrate([0, 300, 100, 300]);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();

      // Countdown timer
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            // Auto-dismiss when countdown reaches 0 (server will auto-reject)
            dismiss();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const dismiss = () => {
    setIncomingOrderSheetOpen(false);
    setIncomingOrder(null);
  };

  const handleAccept = async () => {
    if (!incomingOrder) return;
    try {
      // Use socket for real-time accept
      dispatchSocket.emit(
        'dispatch:accept',
        { orderId: incomingOrder.order.id },
        (ack: { success: boolean; message: string }) => {
          if (ack?.success) {
            dismiss();
            router.push('/(tabs)');
          } else {
            Alert.alert('Error', ack?.message || 'Failed to accept order');
          }
        }
      );
      // Also call REST as fallback if socket doesn't ack
      await accept(incomingOrder.order.id);
      dismiss();
      router.push('/(tabs)');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleReject = async () => {
    if (!incomingOrder) return;
    try {
      // Use socket for real-time reject
      dispatchSocket.emit(
        'dispatch:reject',
        { orderId: incomingOrder.order.id, reason: 'DRIVER_REJECTED' },
        (_ack: any) => {}
      );
      await reject({ orderId: incomingOrder.order.id, reason: 'DRIVER_REJECTED' });
      dismiss();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  if (!isOpen || !incomingOrder) return null;

  const { order, store, userAddress, distanceToStoreKm } = incomingOrder;
  const isBusy = isAccepting || isRejecting;

  // Progress ring percentage
  const progress = countdown / TIMEOUT_SEC;
  const progressColor =
    progress > 0.5 ? COLORS.success : progress > 0.25 ? COLORS.warning : COLORS.danger;

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleReject}
    >
      {/* Backdrop */}
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="bg-surface rounded-t-3xl"
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="px-5 pb-3 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <Text className="text-base font-bold text-textPrimary">New Delivery Request</Text>
            </View>
            {/* Countdown badge */}
            <View
              className="w-12 h-12 rounded-full border-4 items-center justify-center"
              style={{ borderColor: progressColor }}
            >
              <Text className="text-sm font-bold" style={{ color: progressColor }}>
                {countdown}s
              </Text>
            </View>
          </View>

          {/* Store → Customer Route */}
          <View className="px-5 py-4">
            <View className="flex-row items-start gap-3 mb-4">
              <View className="items-center gap-1 mt-1">
                <View className="w-3 h-3 rounded-full bg-primary" />
                <View className="w-0.5 h-10 bg-border" />
                <View className="w-3 h-3 rounded-full bg-success" />
              </View>
              <View className="flex-1 gap-3">
                <View>
                  <Text className="text-xs text-textTertiary">Pick up from</Text>
                  <Text className="text-base font-semibold text-textPrimary mt-0.5">
                    {store.name}
                  </Text>
                  {distanceToStoreKm && (
                    <Text className="text-xs text-textSecondary">
                      {distanceToStoreKm} km away
                    </Text>
                  )}
                </View>
                <View>
                  <Text className="text-xs text-textTertiary">Deliver to</Text>
                  <Text className="text-base font-semibold text-textPrimary mt-0.5">
                    {userAddress.street || 'Customer address'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Earnings Row */}
            <View className="bg-primarySoft rounded-2xl p-4 flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-xs text-textSecondary">Delivery fee</Text>
                <Text className="text-2xl font-bold text-primary">
                  {Number(order.deliveryFees ?? 0).toFixed(2)} EGP
                </Text>
                {Number(order.tipAmount ?? 0) > 0 && (
                  <Text className="text-xs text-success font-medium">
                    +{Number(order.tipAmount).toFixed(2)} EGP tip
                  </Text>
                )}
              </View>
              <View className="items-end">
                <Text className="text-xs text-textSecondary">Customer</Text>
                <Text className="text-sm font-semibold text-textPrimary">
                  {order.customerName}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-5 pb-10 flex-row gap-3">
            {/* Reject */}
            <TouchableOpacity
              className="flex-1 h-14 rounded-2xl border-2 border-border items-center justify-center flex-row gap-2"
              onPress={handleReject}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {isRejecting ? (
                <ActivityIndicator color={COLORS.danger} size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
                  <Text className="font-semibold text-danger text-base">Reject</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Accept */}
            <TouchableOpacity
              className="flex-[2] h-14 rounded-2xl bg-success items-center justify-center flex-row gap-2"
              onPress={handleAccept}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              {isAccepting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} />
                  <Text className="font-bold text-white text-base">Accept Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
