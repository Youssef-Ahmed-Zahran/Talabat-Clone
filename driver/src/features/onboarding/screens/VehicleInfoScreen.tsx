import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  vehicleInfoSchema,
  type VehicleInfoFormValues,
} from '@features/onboarding/schemas/onboarding.schemas';
import { useSubmitApplication } from '@features/onboarding/api/onboarding.api';
import { AuthFormInput } from '@features/auth/components/AuthFormInput';
import { COLORS } from '@constants/theme';
import { getErrorMessage } from '@utils/error';
import type { PersonalInfoFormValues } from '@features/onboarding/schemas/onboarding.schemas';

export default function VehicleInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ personalInfo: string }>();
  const personalInfo: PersonalInfoFormValues = params.personalInfo
    ? JSON.parse(params.personalInfo)
    : {};

  const { mutateAsync, isPending } = useSubmitApplication();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleInfoFormValues>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: {
      vehiclePlateNumber: '',
      drivingLicenseExpiry: '',
      vehicleRegistrationExpiry: '',
    },
  });

  const isBicycle = personalInfo.vehicleType === 'BICYCLE';

  const onSubmit = handleSubmit(async (vehicleValues) => {
    try {
      const payload = {
        ...personalInfo,
        ...vehicleValues,
      };
      await mutateAsync(payload);
      // Move to documents upload
      router.push('/onboarding/documents');
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('approved')) {
        const { useAuthStore } = await import('@store/authStore');
        await useAuthStore.getState().updateDriver({ applicationStatus: 'APPROVED' });
        Alert.alert('Already Approved', 'Your application is already approved! Welcome back.', [
          { text: 'Let\'s Go', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Submission Failed', msg);
      }
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-3 border-b border-border flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-textPrimary">Vehicle Details</Text>
            <Text className="text-sm text-textSecondary mt-0.5">Step 2 of 3</Text>
          </View>
          <View className="flex-row gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            <View className="w-2.5 h-2.5 rounded-full bg-border" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Selected vehicle badge */}
          <View className="bg-primarySoft border border-primary rounded-xl px-4 py-3 mb-6 flex-row items-center gap-3">
            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
            <Text className="text-primary font-semibold text-sm">
              Vehicle type: {personalInfo.vehicleType}
            </Text>
          </View>

          {isBicycle ? (
            <View className="bg-warning-light border border-warning rounded-xl px-4 py-4 mb-6">
              <Text className="text-sm font-semibold text-textPrimary mb-1">
                🚲 Bicycle selected
              </Text>
              <Text className="text-sm text-textSecondary">
                No vehicle registration or driving license is needed for bicycle deliveries. Tap Submit to proceed.
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3">
                Vehicle Information
              </Text>

              <AuthFormInput
                control={control}
                name="vehiclePlateNumber"
                label="Vehicle Plate Number"
                placeholder="e.g. ABC 1234"
                autoCapitalize="characters"
                error={errors.vehiclePlateNumber?.message}
              />

              <AuthFormInput
                control={control}
                name="vehicleRegistrationExpiry"
                label="Vehicle Registration Expiry (YYYY-MM-DD)"
                placeholder="e.g. 2026-12-31"
                keyboardType="numeric"
                error={errors.vehicleRegistrationExpiry?.message}
              />

              <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3 mt-2">
                Driving License
              </Text>

              <AuthFormInput
                control={control}
                name="drivingLicenseExpiry"
                label="License Expiry Date (YYYY-MM-DD)"
                placeholder="e.g. 2027-06-30"
                keyboardType="numeric"
                error={errors.drivingLicenseExpiry?.message}
              />
            </>
          )}

          {/* Info note */}
          <View className="bg-surfaceAlt border border-border rounded-xl px-4 py-3 mb-8">
            <Text className="text-xs text-textSecondary leading-5">
              📄 After submitting, you'll be asked to upload your documents for verification. All fields above are optional but help speed up your approval.
            </Text>
          </View>

          {/* Submit Application */}
          <TouchableOpacity
            className="bg-primary rounded-xl h-14 items-center justify-center flex-row gap-2"
            onPress={onSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text className="text-white font-semibold text-base">Submit Application</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
