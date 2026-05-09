import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers3,
  Store,
  Users,
  Truck,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import ErrorBoundary from "../error-boundary/ErrorBoundary";
import NotificationDropdown from "./NotificationDropdown";

// ── Sidebar Navigation Items ──────────────────────────────────────────
const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Categories", icon: Layers3, path: "/categories" },
  { label: "Stores", icon: Store, path: "/stores" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Drivers", icon: Truck, path: "/drivers" },
  { label: "Orders", icon: ShoppingBag, path: "/orders" },
  { label: "Zones", icon: MapPin, path: "/zones" },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);
  const storeId = useAuthStore((s) => s.storeId);
  const navigate = useNavigate();

  const NAV_ITEMS =
    role === "owner"
      ? [
          { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          { label: "My Store", icon: Store, path: `/stores/${storeId}` },
          { label: "Orders", icon: ShoppingBag, path: "/orders" },
        ]
      : ADMIN_NAV_ITEMS;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
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
          fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200/80
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">
              Talabat
              <span
                className={role === "owner" ? "text-blue-600" : "text-brand"}
              >
                {role === "owner" ? "Partner" : "Admin"}
              </span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Main Menu
          </p>
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-brand-50 text-brand"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive
                        ? "text-brand"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut
              className="w-[18px] h-[18px] text-gray-400 group-hover:text-red-500 transition-colors"
              strokeWidth={1.8}
            />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                    {role === "owner" ? "Store Owner" : "Admin"}
                  </p>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    {role === "owner" ? "Partner Portal" : "Super Admin"}
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

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-fade-in">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
