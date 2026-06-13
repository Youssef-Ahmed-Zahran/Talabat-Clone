import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useRegister as useRegisterMutation } from "../api/auth.api";
import { getErrorMessage } from "@src/utils/error";

export interface UseRegisterReturn {
  form: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    setFullName: (v: string) => void;
    setEmail: (v: string) => void;
    setPhone: (v: string) => void;
    setPassword: (v: string) => void;
    setConfirmPassword: (v: string) => void;
  };
  state: {
    showPassword: boolean;
    isPending: boolean;
    toggleShowPassword: () => void;
  };
  actions: {
    handleRegister: () => void;
  };
  router: {
    navigateToLogin: () => void;
  };
}

export function useRegisterScreen(): UseRegisterReturn {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = useCallback(() => setShowPassword((v) => !v), []);

  const navigateToLogin = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  const handleRegister = useCallback(() => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    registerMutation.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      },
      {
        onSuccess: () => router.replace("/location/country-select"),
        onError: (err) =>
          Alert.alert("Registration Failed", getErrorMessage(err)),
      },
    );
  }, [fullName, email, phone, password, confirmPassword, registerMutation, router]);

  return {
    form: {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      setFullName,
      setEmail,
      setPhone,
      setPassword,
      setConfirmPassword,
    },
    state: {
      showPassword,
      isPending: registerMutation.isPending,
      toggleShowPassword,
    },
    actions: {
      handleRegister,
    },
    router: {
      navigateToLogin,
    },
  };
}
