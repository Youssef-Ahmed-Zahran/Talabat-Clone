import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/protected-route/ProtectedRoute";
import NotFoundPage from "../components/not-found/NotFoundPage";
import PageLoader from "../components/loader/PageLoader";

// ── Core Pages (Eagerly Loaded) ────────────────────────────────────────
import LoginPage from "../features/auth/pages/Login";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import LiveOrdersPage from "../features/orders/pages/LiveOrdersPage";

// ── Heavy Modules (Lazy Loaded) ────────────────────────────────────────
import { StoreDetailsPage, StoreCatalogPage } from "./lazyComponents";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "my-store",
        element: (
          <Suspense fallback={<PageLoader />}>
            <StoreDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "my-store/catalog",
        element: (
          <Suspense fallback={<PageLoader />}>
            <StoreCatalogPage />
          </Suspense>
        ),
      },
      { path: "orders", element: <LiveOrdersPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
