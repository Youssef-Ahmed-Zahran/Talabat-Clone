import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import ErrorBoundary from "../error-boundary/ErrorBoundary";
import Breadcrumbs from "./Breadcrumbs";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        handleLogout={handleLogout}
      />

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          handleLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-fade-in">
            <Breadcrumbs />
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
