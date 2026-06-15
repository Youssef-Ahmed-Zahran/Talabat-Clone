import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@config/axios';
import type { PersonalInfoPayload, VehicleInfoPayload, DocumentUpload, ApplicationStatus } from '@features/onboarding/types/onboarding.types';

// ─── Submit Application (Personal + Vehicle Info merged) ─────
export const useSubmitApplication = () => {
  return useMutation({
    mutationFn: async (payload: PersonalInfoPayload & VehicleInfoPayload) => {
      const res = await api.post('/drivers/application', payload);
      return res.data;
    },
  });
};

// ─── Upload a single document ────────────────────────────────
export const useUploadDocument = () => {
  return useMutation({
    mutationFn: async (payload: DocumentUpload) => {
      const res = await api.post('/drivers/documents', payload);
      return res.data;
    },
  });
};

// ─── Get Application Status ──────────────────────────────────
export const useGetApplication = () => {
  return useQuery({
    queryKey: ['driver-application'],
    queryFn: async () => {
      const res = await api.get<{ data: ApplicationStatus | null }>('/drivers/application');
      return res.data.data;
    },
    retry: false,
  });
};

// ─── Get My Documents ────────────────────────────────────────
export const useGetDocuments = () => {
  return useQuery({
    queryKey: ['driver-documents'],
    queryFn: async () => {
      const res = await api.get('/drivers/documents');
      return res.data.data as Array<{ id: string; documentType: string; fileUrl: string; status: string }>;
    },
  });
};
