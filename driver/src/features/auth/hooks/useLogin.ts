import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { loginSchema, type LoginFormValues } from '@features/auth/schemas/auth.schemas';
import { useLoginApi } from '@features/auth/api/auth.api';
import { getErrorMessage } from '@utils/error';

export const useLogin = () => {
  const router = useRouter();
  const { mutateAsync, isPending } = useLoginApi();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync(values);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Login Failed', getErrorMessage(err));
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
