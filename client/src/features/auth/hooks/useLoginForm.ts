import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginFormValues,
} from "../../../schemas/login.schema";
import { useLoginOwner } from "../api/auth.api";
import { useAuthStore } from "../../../store/authStore";
import { handleApiError } from "../../../utils/error";

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const loginOwnerMutation = useLoginOwner();
  const isPending = loginOwnerMutation.isPending;

  const formMethods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginOwnerMutation.mutate(data, {
      onSuccess: (res) => {
        setAuth(res.owner.storeId);
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
