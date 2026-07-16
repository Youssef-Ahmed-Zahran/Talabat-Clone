import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

/**
 * Create a socket connection for a specific namespace.
 * Driver namespaces: /dispatch, /tracking, /chat, /notifications
 */
export const createSocket = (namespace: string): Socket => {
  return io(`${BASE_URL}${namespace}`, {
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
  });
};

/**
 * Connect a socket with auth token from AsyncStorage
 */
export const connectSocket = async (socket: Socket): Promise<void> => {
  const token = await AsyncStorage.getItem('driver_token');
  if (token) {
    socket.auth = { token };
    socket.connect();
  }
};

/**
 * Pre-configured driver socket instances
 */
export const dispatchSocket = createSocket('/dispatch');
export const trackingSocket = createSocket('/tracking');
export const chatSocket = createSocket('/chat');
export const notificationsSocket = createSocket('/notifications');
