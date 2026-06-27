import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Store", icon: Store, path: "/my-store" },
  { label: "Orders", icon: ShoppingBag, path: "/orders" },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  handleLogout: () => void;
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  handleLogout,
}: SidebarProps) {
  // Role is always "owner" in this app — no conditional nav needed
  useAuthStore((s) => s.role);

  return (
    <>
      {/* ── Mobile Overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200/80
          flex flex-col transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[260px]"}
          w-[260px]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-16 border-b border-gray-100 transition-all duration-300 ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-6"}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-[17px] font-bold text-gray-900 tracking-tight whitespace-nowrap animate-fade-in">
                Talabat
                <span className="text-blue-600">Partner</span>
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 py-4 space-y-0.5 overflow-y-auto ${sidebarCollapsed ? "px-1.5" : "px-3"}`}
        >
          {!sidebarCollapsed ? (
            <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 animate-fade-in">
              Main Menu
            </p>
          ) : (
            <div className="h-px bg-gray-100 my-4 mx-2" />
          )}
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-[13.5px] font-medium transition-all duration-200 group ${
                  sidebarCollapsed
                    ? "justify-center w-11 h-11 mx-auto px-0"
                    : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors flex-shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {!sidebarCollapsed && (
                    <span className="animate-fade-in">{label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Log out" : undefined}
            className={`flex items-center rounded-xl text-[13.5px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group ${
              sidebarCollapsed
                ? "justify-center w-11 h-11 mx-auto px-0"
                : "gap-3 w-full px-3 py-2.5"
            }`}
          >
            <LogOut
              className="w-[18px] h-[18px] text-gray-400 group-hover:text-red-500 transition-colors flex-shrink-0"
              strokeWidth={1.8}
            />
            {!sidebarCollapsed && (
              <span className="animate-fade-in">Log out</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
