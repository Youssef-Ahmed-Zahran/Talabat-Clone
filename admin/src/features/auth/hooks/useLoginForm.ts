import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormValues,
} from "../../../schemas/login.schema";
import { useLoginAdmin } from "../api/auth.api";
import { useAuthStore } from "../../../store/authStore";
import { handleApiError } from "../../../utils/error";

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const loginAdminMutation = useLoginAdmin();
  const isPending = loginAdminMutation.isPending;

  const formMethods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginAdminMutation.mutate(data, {
      onSuccess: () => {
        setAuth("admin");
        toast.success("Welcome back, Admin!");
        navigate("/dashboard", { replace: true });
      },
      onError: (error: unknown) => {
        handleApiError(
          error,
          "We couldn't sign you in. Please check your email and password.",
        );
      },
    });
  };

  return {
    state: {
      showPassword,
      setShowPassword,
      isPending,
    },
    form: {
      register: formMethods.register,
      handleSubmit: formMethods.handleSubmit(onSubmit),
      errors: formMethods.formState.errors,
    },
  };
}
