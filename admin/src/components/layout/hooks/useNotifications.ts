import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { getNotificationSocket } from "../../../config/socket";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const playNotificationSound = () => {
  try {
    const audio = new Audio(
      new URL("../../../assets/sounds/message.mp3", import.meta.url).href,
    );
    audio.volume = 1.0;
    audio.play().catch((err) => {
      console.warn(
        "Audio playback was blocked by browser. Click anywhere on the page to enable sound.",
        err,
      );
    });
  } catch (err) {
    console.error("Failed to play notification sound:", err);
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback((pageNum: number, isInitial = false) => {
    const socket = getNotificationSocket();
    if (!socket) return;

    if (!isInitial) setIsLoadingMore(true);

    socket.emit(
      "notification:fetch",
      { page: pageNum, limit: 10 },
      (res: {
        success: boolean;
        notifications?: Notification[];
        total?: number;
      }) => {
        if (res.success) {
          const newItems = res.notifications || [];
          setNotifications((prev) =>
            isInitial ? newItems : [...prev, ...newItems],
          );
          setHasMore(newItems.length === 10);
        }
        setIsLoadingMore(false);
      },
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications(1, true);
    }, 0);

    const socket = getNotificationSocket();
    if (!socket) return;

    const handleNewNotification = (data: {
      notification: {
        id?: string;
        title: string;
        body: string;
        type: string;
        isRead?: boolean;
        createdAt?: string;
      };
    }) => {
      const { notification } = data;

      const newNotification: Notification = {
        id: notification.id || Math.random().toString(36).substring(7),
        title: notification.title,
        body: notification.body,
        type: notification.type,
        isRead: notification.isRead || false,
        createdAt: notification.createdAt || new Date().toISOString(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
      playNotificationSound();

      toast.success(newNotification.title || "New Notification", {
        icon: "🔔",
        duration: 4000,
      });
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
      clearTimeout(timer);
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = () => {
    const socket = getNotificationSocket();
    if (!socket) return;

    socket.emit("notification:mark_read", {}, (res: { success: boolean }) => {
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    });
  };

  const handleMarkRead = (id: string) => {
    const socket = getNotificationSocket();
    if (!socket) return;

    socket.emit(
      "notification:mark_read",
      { ids: [id] },
      (res: { success: boolean }) => {
        if (res.success) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          );
        }
      },
    );
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const handleClearHistory = () => {
    if (
      !window.confirm("Are you sure you want to clear all notification history?")
    )
      return;

    const socket = getNotificationSocket();
    if (!socket) return;

    socket.emit("notification:clear_all", {}, (res: { success: boolean }) => {
      if (res.success) {
        setNotifications([]);
        setHasMore(false);
        toast.success("Notification history cleared");
      }
    });
  };

  return {
    notifications,
    unreadCount,
    hasMore,
    isLoadingMore,
    handleMarkAllRead,
    handleMarkRead,
    loadMore,
    handleClearHistory,
  };
}
