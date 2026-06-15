import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { registerSchema, type RegisterFormValues } from '@features/auth/schemas/auth.schemas';
import { useRegisterApi } from '@features/auth/api/auth.api';
import { getErrorMessage } from '@utils/error';

export const useRegister = () => {
  const router = useRouter();
  const { mutateAsync, isPending } = useRegisterApi();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      cityName: '',
      governorateName: '',
      countryName: '',
      countryCode: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { confirmPassword, ...payload } = values;
      await mutateAsync(payload);
      // After registration → go to onboarding personal info
      router.replace('/onboarding/personal-info');
    } catch (err) {
      Alert.alert('Registration Failed', getErrorMessage(err));
    }
  });

  return {
    query: {},
    state: {
      form,
    },
    modal: {},
    actions: {
      onSubmit,
      isPending,
    },
  };
};
