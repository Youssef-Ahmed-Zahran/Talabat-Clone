import { LoginForm } from "../components/LoginForm";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";

export default function LoginPage() {
  const role = useAuthStore((s) => s.role);

  if (role) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand/[0.02] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] mx-4 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mb-4 shadow-lg shadow-brand/20">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your admin dashboard
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-white/60 shadow-xl shadow-black/[0.04] p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-gray-400 mt-6">
          Talabat Admin Dashboard — © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
