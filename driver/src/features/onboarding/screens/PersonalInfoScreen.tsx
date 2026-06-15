import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import {
  personalInfoSchema,
  VEHICLE_TYPES,
  SHIRT_SIZES,
  type PersonalInfoFormValues,
} from '@features/onboarding/schemas/onboarding.schemas';
import { AuthFormInput } from '@features/auth/components/AuthFormInput';
import { COLORS } from '@constants/theme';
import { getErrorMessage } from '@utils/error';
import { useAuthStore } from '@store/authStore';

const VEHICLE_LABELS: Record<string, { label: string; icon: string }> = {
  CAR:        { label: 'Car',        icon: 'car-outline' },
  MOTORCYCLE: { label: 'Motorcycle', icon: 'bicycle-outline' },
  BICYCLE:    { label: 'Bicycle',    icon: 'bicycle-outline' },
};

const GENDER_OPTIONS = ['Male', 'Female'];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      vehicleType: undefined,
      firstName: '',
      familyName: '',
      phone: '',
      secondPhone: '',
      isOver18: false,
      gender: '',
      nationality: '',
      nationalId: '',
      interestedInTobacco: false,
    },
  });

  const selectedVehicle = watch('vehicleType');

  // We just store the form values and pass them via router params to step 2
  const onNext = handleSubmit((values) => {
    router.push({
      pathname: '/onboarding/vehicle-info',
      params: { personalInfo: JSON.stringify(values) },
    });
  });

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-3 border-b border-border flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-textPrimary">Personal Information</Text>
            <Text className="text-sm text-textSecondary mt-0.5">Step 1 of 3</Text>
          </View>
          <View className="flex-row items-center gap-4">
            {/* Progress dots */}
            <View className="flex-row gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              <View className="w-2.5 h-2.5 rounded-full bg-border" />
              <View className="w-2.5 h-2.5 rounded-full bg-border" />
            </View>
            {/* Logout button */}
            <TouchableOpacity onPress={logout} className="p-1">
              <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Vehicle Type */}
          <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3">
            Vehicle Type *
          </Text>
          <Controller
            control={control}
            name="vehicleType"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row gap-3 mb-1">
                {VEHICLE_TYPES.map((type) => {
                  const { label, icon } = VEHICLE_LABELS[type];
                  const selected = value === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => onChange(type)}
                      className={`flex-1 items-center py-4 rounded-xl border-2 ${
                        selected ? 'border-primary bg-primarySoft' : 'border-border bg-surfaceAlt'
                      }`}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={icon as any}
                        size={26}
                        color={selected ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text
                        className={`text-xs font-semibold mt-2 ${
                          selected ? 'text-primary' : 'text-textSecondary'
                        }`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
          {errors.vehicleType && (
            <Text className="text-danger text-xs mt-1 mb-3 ml-1">
              {errors.vehicleType.message}
            </Text>
          )}

          {/* Age confirmation */}
          <View className="mt-4 mb-5 flex-row items-center justify-between bg-surfaceAlt border border-border rounded-xl px-4 py-3">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-textPrimary">I am 18 or older *</Text>
              {errors.isOver18 && (
                <Text className="text-danger text-xs mt-0.5">{errors.isOver18.message}</Text>
              )}
            </View>
            <Controller
              control={control}
              name="isOver18"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              )}
            />
          </View>

          {/* Personal Details */}
          <Text className="text-xs font-semibold text-textTertiary uppercase tracking-widest mb-3">
            Personal Details
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <AuthFormInput
                control={control}
                name="firstName"
                label="First Name *"
                placeholder="Ahmed"
                error={errors.firstName?.message}
              />
            </View>
            <View className="flex-1">
              <AuthFormInput
                control={control}
                name="familyName"
                label="Family Name *"
                placeholder="Mohamed"
                error={errors.familyName?.message}
              />
            </View>
          </View>

          <AuthFormInput
            control={control}
            name="phone"
            label="Phone Number *"
            placeholder="+20 1xx xxx xxxx"
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />

          <AuthFormInput
            control={control}
            name="secondPhone"
            label="Second Phone (optional)"
            placeholder="+20 1xx xxx xxxx"
            keyboardType="phone-pad"
            error={errors.secondPhone?.message}
          />

          {/* Gender */}
          <Text className="text-sm font-medium text-textSecondary mb-1.5">Gender (optional)</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row gap-3 mb-4">
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => onChange(g)}
                    className={`flex-1 h-12 items-center justify-center rounded-xl border-2 ${
                      value === g ? 'border-primary bg-primarySoft' : 'border-border bg-surfaceAlt'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text className={`font-semibold text-sm ${value === g ? 'text-primary' : 'text-textSecondary'}`}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <AuthFormInput
            control={control}
            name="nationality"
            label="Nationality (optional)"
            placeholder="e.g. Egyptian"
            error={errors.nationality?.message}
          />

          <AuthFormInput
            control={control}
            name="nationalId"
            label="National ID Number (optional)"
            placeholder="14-digit national ID"
            keyboardType="numeric"
            error={errors.nationalId?.message}
          />

          {/* Shirt Size */}
          <Text className="text-sm font-medium text-textSecondary mb-1.5">Shirt Size (optional)</Text>
          <Controller
            control={control}
            name="shirtSize"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row gap-2 mb-4">
                {SHIRT_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => onChange(value === size ? undefined : size)}
                    className={`flex-1 h-12 items-center justify-center rounded-xl border-2 ${
                      value === size ? 'border-primary bg-primarySoft' : 'border-border bg-surfaceAlt'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text className={`font-semibold text-sm ${value === size ? 'text-primary' : 'text-textSecondary'}`}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {/* Tobacco interest */}
          <View className="mb-6 flex-row items-center justify-between bg-surfaceAlt border border-border rounded-xl px-4 py-3">
            <Text className="text-sm font-semibold text-textPrimary flex-1 mr-3">
              Interested in delivering tobacco products?
            </Text>
            <Controller
              control={control}
              name="interestedInTobacco"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              )}
            />
          </View>

          {/* Next */}
          <TouchableOpacity
            className="bg-primary rounded-xl h-14 items-center justify-center flex-row gap-2"
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text className="text-white font-semibold text-base">Next</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
