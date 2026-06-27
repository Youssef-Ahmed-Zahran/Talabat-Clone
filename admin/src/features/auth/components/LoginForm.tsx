import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { useLoginForm } from "../hooks/useLoginForm";

export function LoginForm() {
  const { state, form } = useLoginForm();

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit} className="space-y-5">
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
              {...form.register("email", { required: "Email is required" })}
              placeholder="admin@talabat.com"
              autoComplete="email"
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border ${
                form.errors.email ? "border-red-500" : "border-gray-200"
              } rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
            />
          </div>
          {form.errors.email && (
            <p className="mt-1.5 text-[11px] font-medium text-red-500">
              {form.errors.email.message as string}
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
              type={state.showPassword ? "text" : "password"}
              {...form.register("password", {
                required: "Password is required",
              })}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full pl-10 pr-11 py-2.5 text-sm bg-white border ${
                form.errors.password ? "border-red-500" : "border-gray-200"
              } rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
            />
            <button
              type="button"
              onClick={() => state.setShowPassword(!state.showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {state.showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {form.errors.password && (
            <p className="mt-1.5 text-[11px] font-medium text-red-500">
              {form.errors.password.message as string}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={state.isPending}
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-brand/20 hover:shadow-lg hover:shadow-brand/30 flex items-center justify-center gap-2"
        >
          {state.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in to Admin"
          )}
        </button>
      </form>
    </div>
  );
}
