import { useMutation } from '@tanstack/react-query';
import api from '../../../config/axios';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  admin?: {
    id: number;
    email: string;
    name: string;
  };
}

interface OwnerLoginResponse {
  token: string;
  owner: {
    id: string;
    email: string;
    storeId: string;
    store: {
      id: string;
      name: string;
      storeType: string;
    };
  };
}

const loginAdmin = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/user/login', payload);
  return data.data ?? data;
};

const loginOwner = async (payload: LoginPayload): Promise<OwnerLoginResponse> => {
  const { data } = await api.post('/auth/owner/login', payload);
  return data.data ?? data;
};

export const useLoginAdmin = () => {
  return useMutation({
    mutationFn: loginAdmin,
  });
};

export const useLoginOwner = () => {
  return useMutation({
    mutationFn: loginOwner,
  });
};
