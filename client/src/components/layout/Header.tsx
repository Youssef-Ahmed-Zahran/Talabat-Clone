import { useState } from "react";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import NotificationDropdown from "./NotificationDropdown";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  handleLogout: () => void;
}

export default function Header({
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  handleLogout,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  // Role is always "owner" in the Partner Portal
  useAuthStore((s) => s.role);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200/60 shadow-sm bg-white"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                Store Owner
              </p>
              <p className="text-[11px] text-gray-400 leading-tight">
                Partner Portal
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200/80 py-1.5 z-50 animate-slide-up">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
