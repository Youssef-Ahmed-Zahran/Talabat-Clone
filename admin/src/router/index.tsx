import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/protected-route/ProtectedRoute";
import NotFoundPage from "../components/not-found/NotFoundPage";

// ── Core Pages (Eagerly Loaded for immediate access) ───────────────────
import LoginPage from "../features/auth/pages/Login";

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
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
