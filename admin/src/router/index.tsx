import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/protected-route/ProtectedRoute";
import NotFoundPage from "../components/not-found/NotFoundPage";
import PageLoader from "../components/loader/PageLoader";

// ── Core Pages (Eagerly Loaded for immediate access) ───────────────────
import LoginPage from "../features/auth/pages/Login";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import MainCategoriesPage from "../features/categories/pages/MainCategoriesPage";
import UsersListPage from "../features/users/pages/UsersListPage";
import UserDetailsPage from "../features/users/pages/UserDetailsPage";
import DriversListPage from "../features/drivers/pages/DriversListPage";
import DriverDetailsPage from "../features/drivers/pages/DriverDetailsPage";
import LiveOrdersPage from "../features/orders/pages/LiveOrdersPage";

// ── Heavy Modules (Lazy Loaded to reduce initial bundle size) ──────────
import {
  StoresListPage,
  StoreDetailsPage,
  StoreCatalogPage,
  ZonesPage,
  ZoneEditorPage,
} from "./lazyComponents";

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
      { path: "categories", element: <MainCategoriesPage /> },
      {
        path: "stores",
        element: (
          <Suspense fallback={<PageLoader />}>
            <StoresListPage />
          </Suspense>
        ),
      },
      {
        path: "stores/:storeId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <StoreDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "stores/:storeId/catalog",
        element: (
          <Suspense fallback={<PageLoader />}>
            <StoreCatalogPage />
          </Suspense>
        ),
      },
      { path: "users", element: <UsersListPage /> },
      { path: "users/:userId", element: <UserDetailsPage /> },
      { path: "drivers", element: <DriversListPage /> },
      { path: "drivers/:driverId", element: <DriverDetailsPage /> },
      { path: "orders", element: <LiveOrdersPage /> },
      {
        path: "zones",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ZonesPage />
          </Suspense>
        ),
      },
      {
        path: "zones/new",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ZoneEditorPage />
          </Suspense>
        ),
      },
      {
        path: "zones/:id/edit",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ZoneEditorPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
