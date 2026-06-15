import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@store/authStore';
import { Loader } from '@components/loader/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const driver = useAuthStore((s) => s.driver);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/auth/login');
      }
      return;
    }

    // Authenticated driver application status
    const appStatus = driver?.applicationStatus; // 'PENDING' | 'APPROVED' | 'REJECTED' | null

    if (inAuthGroup) {
      // Redirect away from login/register if already logged in
      if (appStatus === 'APPROVED') {
        router.replace('/(tabs)');
      } else if (appStatus === 'PENDING' || appStatus === 'REJECTED') {
        router.replace('/onboarding/status');
      } else {
        router.replace('/onboarding/personal-info');
      }
    } else if (inOnboardingGroup) {
      const isStatusPage = segments[1] === 'status';
      if (appStatus === 'APPROVED') {
        router.replace('/(tabs)');
      } else if (appStatus === 'PENDING' && !isStatusPage) {
        // Force pending drivers to stay on the status page
        router.replace('/onboarding/status');
      }
    } else {
      // Trying to access main tabs or deliveries
      if (appStatus !== 'APPROVED') {
        if (appStatus === 'PENDING' || appStatus === 'REJECTED') {
          router.replace('/onboarding/status');
        } else {
          router.replace('/onboarding/personal-info');
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, driver?.applicationStatus]);

  if (isLoading) return <Loader />;

  return <>{children}</>;
}
