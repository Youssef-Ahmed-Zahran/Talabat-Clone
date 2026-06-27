import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "./hooks/useNotifications";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    hasMore,
    isLoadingMore,
    handleMarkAllRead,
    handleMarkRead,
    loadMore,
    handleClearHistory,
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadMore();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand ring-2 ring-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-brand hover:text-brand-dark transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                        !n.isRead ? "bg-brand-50/10" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            !n.isRead ? "bg-brand" : "bg-transparent"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-tight mb-1 ${
                              !n.isRead
                                ? "text-gray-900 font-semibold"
                                : "text-gray-600"
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full py-3 text-xs font-medium text-gray-500 hover:text-brand hover:bg-gray-50 transition-all border-t border-gray-50 flex items-center justify-center gap-2"
                  >
                    {isLoadingMore ? (
                      <span className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {isLoadingMore ? "Loading..." : "View older notifications"}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="p-3 bg-gray-50/50 border-t border-gray-50 text-center">
            <button
              onClick={handleClearHistory}
              className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear all history
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
