import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { useAuthStore } from '@store/authStore';
import { notificationsSocket, connectSocket } from '@config/socket';

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Connects to the /notifications socket namespace and listens for
 * server-pushed notification events (e.g. payout completed, rating received).
 *
 * Mount this once at the app root level (e.g. HomeScreen layout).
 */
export const useNotificationsListener = () => {
  const driver = useAuthStore((s) => s.driver);
  const appState = useRef(AppState.currentState);

  // Reconnect when the app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          if (!notificationsSocket.connected) {
            connectSocket(notificationsSocket);
          }
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!driver) return;

    const handleNotification = (payload: NotificationPayload) => {
      console.log('[NotificationsListener] received:', payload.type, payload.title);
      // Show an in-app alert for important server notifications
      if (payload.title && payload.body) {
        Alert.alert(payload.title, payload.body);
      }
    };

    // Register handler before connecting so no events are missed
    notificationsSocket.on('notification', handleNotification);

    if (!notificationsSocket.connected) {
      connectSocket(notificationsSocket).then(() => {
        console.log('[NotificationsListener] Connected to /notifications');
      });
    }

    return () => {
      notificationsSocket.off('notification', handleNotification);
    };
  }, [driver]);

  // Disconnect on logout (driver becomes null)
  useEffect(() => {
    if (!driver && notificationsSocket.connected) {
      notificationsSocket.disconnect();
      console.log('[NotificationsListener] Disconnected (logged out)');
    }
  }, [driver]);
};
