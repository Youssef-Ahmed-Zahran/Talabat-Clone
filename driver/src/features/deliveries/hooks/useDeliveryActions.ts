import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAcceptDelivery,
  useRejectDelivery,
  useUpdateDeliveryStatus,
  DeliveryStatus,
} from '@features/deliveries/api/deliveries.api';
import { useUIStore } from '@store/uiStore';
import { getErrorMessage } from '@utils/error';
import { useQueryClient } from '@tanstack/react-query';
import { DELIVERY_KEYS } from '@features/deliveries/api/deliveries.api';

export const useDeliveryActions = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const setIncomingOrderSheetOpen = useUIStore((s) => s.setIncomingOrderSheetOpen);
  const setIncomingOrder = useUIStore((s) => s.setIncomingOrder);

  const { mutateAsync: accept, isPending: isAccepting } = useAcceptDelivery();
  const { mutateAsync: reject, isPending: isRejecting } = useRejectDelivery();
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateDeliveryStatus();

  const handleAccept = useCallback(
    async (orderId: string) => {
      try {
        await accept(orderId);
        setIncomingOrderSheetOpen(false);
        setIncomingOrder(null);
        qc.invalidateQueries({ queryKey: DELIVERY_KEYS.active() });
        router.push('/deliveries/active');
      } catch (err) {
        Alert.alert('Error', getErrorMessage(err));
      }
    },
    [accept, setIncomingOrderSheetOpen, setIncomingOrder, qc, router]
  );

  const handleReject = useCallback(
    async (orderId: string, reason?: string) => {
      try {
        await reject({ orderId, reason });
        setIncomingOrderSheetOpen(false);
        setIncomingOrder(null);
      } catch (err) {
        Alert.alert('Error', getErrorMessage(err));
      }
    },
    [reject, setIncomingOrderSheetOpen, setIncomingOrder]
  );

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: DeliveryStatus) => {
      try {
        await updateStatus({ orderId, status });
        qc.invalidateQueries({ queryKey: DELIVERY_KEYS.active() });
        if (status === 'DELIVERED') {
          Alert.alert('🎉 Delivered!', 'Great job! You have successfully delivered the order.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
        }
      } catch (err) {
        Alert.alert('Error', getErrorMessage(err));
      }
    },
    [updateStatus, qc, router]
  );

  return {
    query: {},
    state: {},
    modal: {},
    actions: {
      handleAccept,
      handleReject,
      handleStatusUpdate,
      isAccepting,
      isRejecting,
      isUpdating,
    },
  };
};
