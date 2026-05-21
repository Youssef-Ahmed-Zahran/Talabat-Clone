import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useLoginForm } from "../hooks/useLoginForm";

export function LoginForm() {
  const {
    showPassword,
    setShowPassword,
    role,
    setRole,
    isPending,
    register,
    handleSubmit,
    errors,
  } = useLoginForm();

  return (
    <div className="space-y-6">
      {/* Role Selection Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setRole("admin")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            role === "admin"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => setRole("owner")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            role === "owner"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Store Owner
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-[13px] font-medium text-gray-700 mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="login-email"
              type="email"
              {...register("email", { required: "Email is required" })}
              placeholder="admin@talabat.com"
              autoComplete="email"
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border ${
                errors.email ? "border-red-500" : "border-gray-200"
              } rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-[11px] font-medium text-red-500">
              {errors.email.message as string}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-[13px] font-medium text-gray-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
              })}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full pl-10 pr-11 py-2.5 text-sm bg-white border ${
                errors.password ? "border-red-500" : "border-gray-200"
              } rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-[11px] font-medium text-red-500">
              {errors.password.message as string}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-brand/20 hover:shadow-lg hover:shadow-brand/30 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}
