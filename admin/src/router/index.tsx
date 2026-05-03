import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/protected-route/ProtectedRoute";
import NotFoundPage from "../components/not-found/NotFoundPage";

// ── Core Pages (Eagerly Loaded for immediate access) ───────────────────
import LoginPage from "../features/auth/pages/Login";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import MainCategoriesPage from "../features/categories/pages/MainCategoriesPage";
import SubCategoriesPage from "../features/categories/pages/SubCategoriesPage";

// ── Heavy Modules (Lazy Loaded to reduce initial bundle size) ──────────

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
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
