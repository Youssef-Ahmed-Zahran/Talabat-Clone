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
import SubCategoriesPage from "../features/categories/pages/SubCategoriesPage";
import UsersListPage from "../features/users/pages/UsersListPage";
import UserDetailsPage from "../features/users/pages/UserDetailsPage";

// ── Heavy Modules (Lazy Loaded to reduce initial bundle size) ──────────
import {
  StoresListPage,
  StoreDetailsPage,
  StoreCatalogPage,
  ProductOptionsPage,
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
        path: "categories/:mainId/subcategories",
        element: <SubCategoriesPage />,
      },
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
      {
        path: "stores/:storeId/catalog/products/:productId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductOptionsPage />
          </Suspense>
        ),
      },
      { path: "users", element: <UsersListPage /> },
      { path: "users/:userId", element: <UserDetailsPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
