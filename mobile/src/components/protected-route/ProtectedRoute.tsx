import React, { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@src/store/authStore";
import { useLocationStore } from "@src/store/locationStore";
import { Loader } from "@src/components/loader/Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const hasLocation = useLocationStore((s) => s.hasLocation);
  const isLocationLoading = useLocationStore((s) => s.isLocationLoading);
  const selectedCountryCode = useLocationStore((s) => s.selectedCountryCode);
  const selectedCountryName = useLocationStore((s) => s.selectedCountryName);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAuthLoading || isLocationLoading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace("/auth/login");
      }
      setIsReady(true);
      return;
    }

    // If authenticated, redirect away from auth screens
    if (inAuthGroup) {
      router.replace("/(tabs)/home");
    }

    setIsReady(true);
  }, [
    isAuthenticated,
    isAuthLoading,
    hasLocation,
    isLocationLoading,
    segments,
    selectedCountryCode,
    selectedCountryName,
    router,
  ]);

  if (isAuthLoading || isLocationLoading || !isReady) {
    return <Loader message="Loading..." />;
  }

  return <>{children}</>;
}
