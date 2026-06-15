import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGetApplication } from '@features/onboarding/api/onboarding.api';
import { COLORS } from '@constants/theme';
import { useAuthStore } from '@store/authStore';

const STATUS_CONFIG = {
  PENDING: {
    icon: 'time-outline',
    iconColor: COLORS.warning,
    bgClass: 'bg-warningLight',
    borderClass: 'border-warning',
    title: 'Under Review',
    subtitle: 'Your application is being reviewed by our team.',
    body: 'This usually takes 1–2 business days. We will notify you once a decision is made.',
  },
  APPROVED: {
    icon: 'checkmark-circle',
    iconColor: COLORS.success,
    bgClass: 'bg-successLight',
    borderClass: 'border-success',
    title: 'Application Approved! 🎉',
    subtitle: 'Congratulations! You are now a verified driver.',
    body: 'You can now go online and start accepting delivery requests.',
  },
  REJECTED: {
    icon: 'close-circle',
    iconColor: COLORS.danger,
    bgClass: 'bg-dangerLight',
    borderClass: 'border-danger',
    title: 'Application Rejected',
    subtitle: 'Your application was not approved at this time.',
    body: 'Please review the reason below and resubmit with the correct information.',
  },
} as const;

export default function StatusScreen() {
  const router = useRouter();
  const driver = useAuthStore((s) => s.driver);
  const logout = useAuthStore((s) => s.logout);
  const updateDriver = useAuthStore((s) => s.updateDriver);
  const { data: application, isLoading, refetch } = useGetApplication();

  // Keep auth store synced with the live fetched application status
  useEffect(() => {
    if (application?.status) {
      updateDriver({ applicationStatus: application.status });
    }
  }, [application?.status]);

  // If approved → let them go to main tabs
  const status = application?.status ?? null;
  const config = status ? STATUS_CONFIG[status] : null;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 border-b border-border flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">Application Status</Text>
          <Text className="text-sm text-textSecondary mt-0.5">
            {driver?.email}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} className="p-1">
          <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-textSecondary mt-4">Checking your status…</Text>
          </View>
        ) : !application ? (
          /* No application yet — shouldn't normally land here */
          <View className="items-center py-16">
            <View className="w-24 h-24 rounded-full bg-surfaceAlt items-center justify-center mb-6">
              <Ionicons name="document-text-outline" size={48} color={COLORS.textTertiary} />
            </View>
            <Text className="text-xl font-bold text-textPrimary mb-2">No Application Found</Text>
            <Text className="text-textSecondary text-center mb-8">
              Start your driver registration to begin delivering.
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-xl h-14 px-8 items-center justify-center"
              onPress={() => router.replace('/onboarding/personal-info')}
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold text-base">Start Registration</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Status card */}
            <View className={`rounded-2xl border-2 ${config!.bgClass} ${config!.borderClass} p-6 mb-6 items-center`}>
              <Ionicons name={config!.icon as any} size={64} color={config!.iconColor} />
              <Text className="text-2xl font-bold text-textPrimary mt-4 mb-2 text-center">
                {config!.title}
              </Text>
              <Text className="text-base text-textSecondary text-center mb-3">
                {config!.subtitle}
              </Text>
              <Text className="text-sm text-textSecondary text-center leading-6">
                {config!.body}
              </Text>
            </View>

            {/* Rejection reason */}
            {status === 'REJECTED' && application.rejectionReason && (
              <View className="bg-dangerLight border border-danger rounded-xl px-4 py-4 mb-6">
                <Text className="text-sm font-semibold text-danger mb-1">
                  Reason for rejection:
                </Text>
                <Text className="text-sm text-textPrimary leading-5">
                  {application.rejectionReason}
                </Text>
              </View>
            )}

            {/* Application details */}
            {(application.firstName || application.vehicleType) && (
              <View className="bg-surfaceAlt border border-border rounded-xl px-4 py-4 mb-6">
                <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3">
                  Your Application
                </Text>
                {application.firstName && (
                  <View className="flex-row justify-between py-2 border-b border-border">
                    <Text className="text-sm text-textSecondary">Name</Text>
                    <Text className="text-sm font-semibold text-textPrimary">
                      {application.firstName} {application.familyName}
                    </Text>
                  </View>
                )}
                {application.vehicleType && (
                  <View className="flex-row justify-between py-2">
                    <Text className="text-sm text-textSecondary">Vehicle Type</Text>
                    <Text className="text-sm font-semibold text-textPrimary">
                      {application.vehicleType}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            {status === 'APPROVED' && (
              <TouchableOpacity
                className="bg-primary rounded-xl h-14 items-center justify-center"
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.85}
              >
                <Text className="text-white font-semibold text-base">
                  Start Delivering 🚀
                </Text>
              </TouchableOpacity>
            )}

            {status === 'REJECTED' && (
              <TouchableOpacity
                className="bg-primary rounded-xl h-14 items-center justify-center"
                onPress={() => router.replace('/onboarding/personal-info')}
                activeOpacity={0.85}
              >
                <Text className="text-white font-semibold text-base">
                  Resubmit Application
                </Text>
              </TouchableOpacity>
            )}

            {status === 'PENDING' && (
              <TouchableOpacity
                className="bg-surfaceAlt border border-border rounded-xl h-14 items-center justify-center flex-row gap-2"
                onPress={() => refetch()}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh-outline" size={20} color={COLORS.textSecondary} />
                <Text className="text-textSecondary font-semibold text-base">
                  Refresh Status
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
