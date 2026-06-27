import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const role = useAuthStore((s) => s.role);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
