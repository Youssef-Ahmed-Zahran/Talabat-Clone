import { useState, useEffect, useCallback, useRef } from "react";
import { FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { io, Socket } from "socket.io-client";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@src/store/authStore";
import type { Message } from "@src/features/tracking/types/messaging.types";
import { UseChatReturn } from "../types/tracking.types";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8080";
export function useChat(): UseChatReturn {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Setup socket connection
  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;

    const setup = async () => {
      const token = await AsyncStorage.getItem("user_token");
      if (!token) {
        if (isMounted) {
          setConnectError("Not authenticated.");
          setIsConnecting(false);
        }
        return;
      }

      const socket = io(`${BASE_URL}/chat`, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit(
          "chat:join",
          { orderId },
          (res: {
            success: boolean;
            conversationId?: string;
            messages?: Message[];
            message?: string;
          }) => {
            if (!isMounted) return;
            if (res.success) setMessages(res.messages ?? []);
            else setConnectError(res.message ?? "Could not join conversation.");
            setIsConnecting(false);
          },
        );
      });

      socket.on(
        "chat:message",
        async ({ message }: { orderId: string; message: Message }) => {
          if (!isMounted) return;
          setMessages((prev) => [...prev, message]);
          if (message.senderType !== "USER" || message.senderId !== user?.id) {
            try {
              const { sound } = await Audio.Sound.createAsync(
                require("@assets/sounds/message.mp3"),
              );
              await sound.playAsync();
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish)
                  sound.unloadAsync();
              });
            } catch {
              /* ignore sound errors */
            }
          }
        },
      );

      socket.on(
        "chat:typing",
        ({ isTyping: typing }: { isTyping: boolean }) => {
          if (!isMounted) return;
          setIsTyping(typing);
          if (typing)
            setTimeout(() => {
              if (isMounted) setIsTyping(false);
            }, 3000);
        },
      );

      socket.on("connect_error", (err) => {
        if (!isMounted) return;
        setConnectError(err.message ?? "Connection failed.");
        setIsConnecting(false);
      });
    };

    setup();
    return () => {
      isMounted = false;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        80,
      );
    }
  }, [messages]);

  const handleTyping = useCallback(
    (val: string) => {
      setText(val);
      socketRef.current?.emit("chat:typing", { orderId, isTyping: true });
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socketRef.current?.emit("chat:typing", { orderId, isTyping: false });
      }, 1500);
    },
    [orderId],
  );

  const handleSend = useCallback(() => {
    const body = text.trim();
    if (!body || !orderId || isSending) return;
    setText("");
    setIsSending(true);
    socketRef.current?.emit(
      "chat:message",
      { orderId, body },
      (res: { success: boolean }) => {
        setIsSending(false);
        if (!res?.success) setText(body);
      },
    );
  }, [text, orderId, isSending]);

  const navigateBack = useCallback(() => router.back(), [router]);

  return {
    query: {
      orderId: orderId || "",
      userId: user?.id,
      messages,
    },
    state: {
      text,
      isConnecting,
      connectError,
      isSending,
      isTyping,
    },
    actions: {
      setText,
      handleTyping,
      handleSend,
    },
    refs: {
      flatListRef,
    },
    router: {
      navigateBack,
    },
  };
}
