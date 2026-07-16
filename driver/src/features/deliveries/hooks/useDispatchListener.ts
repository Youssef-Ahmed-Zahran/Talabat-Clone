import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@store/uiStore';
import { useAuthStore } from '@store/authStore';
import { dispatchSocket, connectSocket } from '@config/socket';
import { DELIVERY_KEYS } from '@features/deliveries/api/deliveries.api';
import type { DispatchPayload } from '@features/deliveries/types/delivery.types';

/**
 * Listens to the /dispatch socket namespace for new order assignments.
 * When a dispatch:new_order event is received, it stores the payload
 * in UIStore so the IncomingOrderSheet can show it.
 */
export const useDispatchListener = () => {
  const isOnline = useUIStore((s) => s.isOnline);
  const setIncomingOrder = useUIStore((s) => s.setIncomingOrder);
  const setIncomingOrderSheetOpen = useUIStore((s) => s.setIncomingOrderSheetOpen);
  const driver = useAuthStore((s) => s.driver);
  const qc = useQueryClient();
  const appState = useRef(AppState.currentState);

  // Reconnect socket when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isOnline && !dispatchSocket.connected) {
          console.log('[DispatchListener] App foregrounded, reconnecting socket...');
          connectSocket(dispatchSocket);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isOnline]);

  useEffect(() => {
    if (!driver || !isOnline) return;

    const handleNewOrder = (payload: DispatchPayload) => {
      console.log('[DispatchListener] dispatch:new_order received:', payload.order.id);
      setIncomingOrder(payload);
      setIncomingOrderSheetOpen(true);
      // Invalidate pending query so REST fallback stays in sync
      qc.invalidateQueries({ queryKey: DELIVERY_KEYS.pending() });
    };

    // Register handler FIRST so no events are missed while connecting
    dispatchSocket.on('dispatch:new_order', handleNewOrder);

    // Safety-net: ensure socket is connected.
    if (!dispatchSocket.connected) {
      connectSocket(dispatchSocket).then(() => {
        console.log('[DispatchListener] Safety-net connect to /dispatch');
      });
    }

    return () => {
      dispatchSocket.off('dispatch:new_order', handleNewOrder);
    };
  }, [driver, isOnline, setIncomingOrder, setIncomingOrderSheetOpen, qc]);

  // When driver goes offline, disconnect from dispatch
  useEffect(() => {
    if (!isOnline && dispatchSocket.connected) {
      dispatchSocket.disconnect();
      console.log('[DispatchListener] Disconnected from /dispatch (offline)');
    }
  }, [isOnline]);
};
