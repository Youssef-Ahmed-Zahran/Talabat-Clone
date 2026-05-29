import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormValues,
} from "../../../schemas/login.schema";
import { useLoginAdmin, useLoginOwner } from "../api/auth.api";
import { useAuthStore } from "../../../store/authStore";
import { handleApiError } from "../../../utils/error";

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "owner">("admin");
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);

  const loginAdminMutation = useLoginAdmin();
  const loginOwnerMutation = useLoginOwner();

  const isPending =
    loginAdminMutation.isPending || loginOwnerMutation.isPending;

  const formMethods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    if (role === "admin") {
      loginAdminMutation.mutate(data, {
        onSuccess: (res) => {
          setToken(res.token, "admin");
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
    } else {
      loginOwnerMutation.mutate(data, {
        onSuccess: (res) => {
          setToken(res.token, "owner", res.owner.storeId);
          toast.success(`Welcome back! Managing ${res.owner.store.name}`);
          navigate(`/dashboard`, { replace: true });
        },
        onError: (error: unknown) => {
          handleApiError(
            error,
            "We couldn't sign you in. Please check your store owner credentials.",
          );
        },
      });
    }
  };

  return {
    state: {
      showPassword,
      setShowPassword,
      role,
      setRole,
      isPending,
    },
    form: {
      register: formMethods.register,
      handleSubmit: formMethods.handleSubmit(onSubmit),
      errors: formMethods.formState.errors,
    },
  };
}
