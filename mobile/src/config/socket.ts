import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

/**
 * Create a socket connection for a specific namespace.
 * Namespaces: /tracking, /chat, /notifications, /dispatch
 */
export const createSocket = (namespace: string): Socket => {
  return io(`${BASE_URL}${namespace}`, {
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
};

/**
 * Connect a socket with auth token
 */
export const connectSocket = async (socket: Socket): Promise<void> => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    socket.auth = { token };
    socket.connect();
  }
};

/**
 * Pre-configured socket instances
 */
export const trackingSocket = createSocket('/tracking');
export const chatSocket = createSocket('/chat');
export const notificationsSocket = createSocket('/notifications');
