import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@src/config/axios";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@src/features/account/types/user.types";
import type { ApiResponse } from "@src/types/api.types";

// ─── Get Profile ──────────────────────────────────────────────
export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserProfile>>("/users/profile");
      return res.data.data;
    },
  });
};

// ─── Update Profile ───────────────────────────────────────────
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const res = await api.put<ApiResponse<UserProfile>>(
        "/users/profile",
        data,
      );
      return res.data.data;
    },
  });
};

// ─── Change Password ──────────────────────────────────────────
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const res = await api.patch<ApiResponse<null>>("/users/password", data);
      return res.data;
    },
  });
};
