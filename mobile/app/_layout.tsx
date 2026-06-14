import React, { useEffect } from "react";
import { Alert } from "react-native";
import { Stack } from "expo-router";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "@src/config/queryClient";
import { useAuthStore } from "@src/store/authStore";
import { useLocationStore } from "@src/store/locationStore";
import { ErrorBoundary } from "@src/components/error-boundary/ErrorBoundary";
import { ProtectedRoute } from "@src/components/protected-route/ProtectedRoute";
import { COLORS } from "@src/constants/theme";

export default function RootLayout() {
  const loadAuth = useAuthStore((s) => s.loadAuth);
  const loadLocation = useLocationStore((s) => s.loadLocation);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadAuth();
    loadLocation();
  }, [loadAuth, loadLocation]);

  useEffect(() => {
    if (user) {
      // Connect to global notifications
      import("@src/config/socket").then(
        ({ notificationsSocket, connectSocket }) => {
          connectSocket(notificationsSocket);

          notificationsSocket.on("notification:push", async (data) => {
            // Play sound
            import("expo-av").then(async ({ Audio }) => {
              try {
                const { sound } = await Audio.Sound.createAsync(
                  require("@assets/sounds/message.mp3"),
                );
                await sound.playAsync();
                sound.setOnPlaybackStatusUpdate((status) => {
                  if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                  }
                });
              } catch (err) {
                console.log("Failed to play global sound", err);
              }
            });

            // Show alert
            Alert.alert(data.title, data.body);
          });
        },
      );
    }

    return () => {
      import("@src/config/socket").then(({ notificationsSocket }) => {
        notificationsSocket.off("notification:push");
        notificationsSocket.disconnect();
      });
    };
  }, [user]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <StatusBar style="dark" />
          <ProtectedRoute>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.white },
                animation: "slide_from_right",
              }}
            >
              {/* Auth screens */}
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="auth/register" />

              {/* Location flow */}
              <Stack.Screen name="location/country-select" />
              <Stack.Screen name="location/map-picking" />
              <Stack.Screen name="location/address" />

              {/* Main tabs */}
              <Stack.Screen name="(tabs)" />

              {/* Store screens */}
              <Stack.Screen name="stores/list" />
              <Stack.Screen name="stores/detail" />

              {/* Checkout */}
              <Stack.Screen name="checkout" />

              {/* Tracking */}
              <Stack.Screen name="tracking/live" />
              <Stack.Screen name="tracking/chat" />

              {/* Orders detail */}
              <Stack.Screen name="orders/detail" />

              {/* Account sub-screens */}
              <Stack.Screen name="account/profile" />
              <Stack.Screen name="account/addresses" />
              <Stack.Screen name="account/wishlist" />
            </Stack>
          </ProtectedRoute>
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
