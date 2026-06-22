import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useLogin as useLoginMutation } from "../api/auth.api";
import { getErrorMessage } from "@src/utils/error";
import { UseLoginReturn } from "../types/auth.types";
export function useLoginScreen(): UseLoginReturn {
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = useCallback(() => setShowPassword((v) => !v), []);

  const navigateToRegister = useCallback(() => {
    router.push("/auth/register");
  }, [router]);

  const handleLogin = useCallback(() => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          // ProtectedRoute will automatically redirect to /(tabs)/home once auth state updates
        },
        onError: (err) => Alert.alert("Login Failed", getErrorMessage(err)),
      },
    );
  }, [email, password, loginMutation, router]);

  return {
    form: {
      email,
      password,
      setEmail,
      setPassword,
    },
    state: {
      showPassword,
      isPending: loginMutation.isPending,
      toggleShowPassword,
    },
    actions: {
      handleLogin,
    },
    router: {
      navigateToRegister,
    },
  };
}
