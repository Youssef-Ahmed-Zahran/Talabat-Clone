import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@config/queryClient";
import { useAuthStore } from "@store/authStore";
import { useLocationStore } from "@store/locationStore";
import { useUIStore } from "@store/uiStore";
import { ErrorBoundary } from "@components/error-boundary/ErrorBoundary";
import { ProtectedRoute } from "@components/protected-route/ProtectedRoute";
import { COLORS } from "@constants/theme";
import { notificationsSocket, connectSocket } from "@config/socket";
import { Alert } from "react-native";

export function RootLayout() {
  const loadAuth = useAuthStore((s) => s.loadAuth);
  const loadLocationPermission = useLocationStore(
    (s) => s.loadLocationPermission,
  );
  const driver = useAuthStore((s) => s.driver);
  const setOnline = useUIStore((s) => s.setOnline);

  // Bootstrap persisted auth and location permission on first mount
  useEffect(() => {
    loadAuth().then(() => {
      // Sync fresh profile status from API if token exists
      const token = useAuthStore.getState().token;
      if (token) {
        import("@config/axios").then(({ default: api }) => {
          api
            .get("/drivers/profile")
            .then((res) => {
              const fresh = res.data.data;
              if (fresh) {
                useAuthStore.getState().updateDriver({
                  isOnline: fresh.isOnline,
                  status: fresh.status,
                  applicationStatus: fresh.application?.status ?? null,
                  firstName: fresh.application?.firstName ?? null,
                  familyName: fresh.application?.familyName ?? null,
                });
              }
            })
            .catch(() => {});
        });
      }
    });
    loadLocationPermission();
  }, []);

  // Connect/disconnect notifications socket when auth changes
  useEffect(() => {
    if (!driver) return;

    connectSocket(notificationsSocket).then(() => {
      notificationsSocket.on(
        "notification:push",
        (data: { title: string; body: string }) => {
          Alert.alert(data.title, data.body);
        },
      );
    });

    return () => {
      notificationsSocket.off("notification:push");
      notificationsSocket.disconnect();
    };
  }, [driver?.id]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <StatusBar style="dark" />
          <ProtectedRoute>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.surface },
                animation: "slide_from_right",
              }}
            >
              {/* Auth */}
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />

              {/* Onboarding */}
              <Stack.Screen name="onboarding" />

              {/* Main tabs */}
              <Stack.Screen name="(tabs)" />

              {/* Delivery screens */}
              <Stack.Screen name="deliveries/[id]" />
              <Stack.Screen name="deliveries/active" />

              {/* Wallet screens */}
              <Stack.Screen name="wallet/repay" />
            </Stack>
          </ProtectedRoute>
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
