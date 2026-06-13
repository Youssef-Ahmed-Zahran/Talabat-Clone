import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@src/store/authStore";
import { useLocationStore } from "@src/store/locationStore";
import { useLogout } from "@src/features/auth/api/auth.api";
import type { AuthUser } from "@src/features/auth/types/auth.types";

export interface UseAccountReturn {
  query: {
    user: AuthUser | null;
  };
  state: {
    isLoggingOut: boolean;
  };
  actions: {
    handleLogout: () => void;
  };
  router: {
    navigateTo: (route: string) => void;
    navigateToProfile: () => void;
  };
}

export function useAccount(): UseAccountReturn {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const clearLocation = useLocationStore((s) => s.clearLocation);

  const navigateTo = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router],
  );

  const navigateToProfile = useCallback(() => {
    router.push("/account/profile");
  }, [router]);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearLocation();
          logoutMutation.mutate();
          router.replace("/auth/login");
        },
      },
    ]);
  }, [clearLocation, logoutMutation, router]);

  return {
    query: {
      user,
    },
    state: {
      isLoggingOut: logoutMutation.isPending,
    },
    actions: {
      handleLogout,
    },
    router: {
      navigateTo,
      navigateToProfile,
    },
  };
}
