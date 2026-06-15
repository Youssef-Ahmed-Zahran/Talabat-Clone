import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@store/uiStore';
import { useAuthStore } from '@store/authStore';
import { dispatchSocket, connectSocket } from '@config/socket';
import { DELIVERY_KEYS } from '@features/deliveries/api/deliveries.api';

// The payload from dispatch:new_order socket event
export interface DispatchPayload {
  order: {
    id: string;
    subtotal: number;
    deliveryFees: number;
    tipAmount: number;
    totalAmount: number;
    deliveryInstructions: string | null;
    createdAt: string;
    customerName: string;
    customerPhone: string | null;
  };
  store: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  userAddress: {
    latitude: number;
    longitude: number;
    street: string | null;
  };
  assignment: {
    id: string;
    status: string;
    assignedAt: string;
  };
  distanceToStoreKm: string | null;
}

/**
 * Listens to the /dispatch socket namespace for new order assignments.
 * When a dispatch:new_order event is received, it stores the payload
 * in UIStore so the IncomingOrderSheet can show it.
 *
 * This hook should be mounted once in the home screen or tabs layout.
 */
export const useDispatchListener = () => {
  const isOnline = useUIStore((s) => s.isOnline);
  const setIncomingOrder = useUIStore((s) => s.setIncomingOrder);
  const setIncomingOrderSheetOpen = useUIStore((s) => s.setIncomingOrderSheetOpen);
  const driver = useAuthStore((s) => s.driver);
  const qc = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!driver || !isOnline) return;

    // Connect to dispatch socket if online
    if (!connectedRef.current) {
      connectSocket(dispatchSocket).then(() => {
        connectedRef.current = true;
        console.log('[DispatchListener] Connected to /dispatch');
      });
    }

    const handleNewOrder = (payload: DispatchPayload) => {
      console.log('[DispatchListener] dispatch:new_order received:', payload.order.id);
      setIncomingOrder(payload);
      setIncomingOrderSheetOpen(true);
      // Invalidate pending query so REST fallback stays in sync
      qc.invalidateQueries({ queryKey: DELIVERY_KEYS.pending() });
    };

    dispatchSocket.on('dispatch:new_order', handleNewOrder);

    return () => {
      dispatchSocket.off('dispatch:new_order', handleNewOrder);
    };
  }, [driver, isOnline]);

  // When driver goes offline, disconnect from dispatch
  useEffect(() => {
    if (!isOnline && connectedRef.current) {
      dispatchSocket.disconnect();
      connectedRef.current = false;
      console.log('[DispatchListener] Disconnected from /dispatch (offline)');
    }
  }, [isOnline]);
};
