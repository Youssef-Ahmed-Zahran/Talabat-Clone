import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

let notificationSocket: Socket | null = null;

export const initNotificationSocket = () => {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  if (!notificationSocket) {
    // Determine backend URL
    const isDev = import.meta.env.MODE === "development";
    const baseURL = isDev ? "http://localhost:8080" : "";

    notificationSocket = io(`${baseURL}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    notificationSocket.on("connect", () => {
      console.log("Connected to notifications socket");
    });

    notificationSocket.on("disconnect", () => {
      console.log("Disconnected from notifications socket");
    });
  }

  return notificationSocket;
};

export const getNotificationSocket = () => {
  if (!notificationSocket) {
    return initNotificationSocket();
  }
  return notificationSocket;
};

export const disconnectNotificationSocket = () => {
  if (notificationSocket) {
    notificationSocket.disconnect();
    notificationSocket = null;
  }
};
