import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../../config/axios";
import type { Driver } from "../../../types";

// ── Response shape from backend ────────────────────────────────────────
interface DriversResponse {
  drivers: Driver[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Fetch all drivers (admin endpoint) ─────────────────────────────────
const fetchDrivers = async (search?: string, page?: number, limit?: number): Promise<DriversResponse> => {
  const { data } = await api.get("/admin/drivers", {
    params: { search, page, limit }
  });
  return data.data ?? data;
};

export const useDrivers = (search?: string, page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["drivers", search, page, limit],
    queryFn: () => fetchDrivers(search, page, limit),
  });
};

// ── Fetch a single driver by ID ─────────────────────────────────────────
const fetchDriverById = async (id: string): Promise<Driver> => {
  const { data } = await api.get(`/admin/drivers/${id}`);
  return data.data ?? data;
};

export const useDriver = (id: string) => {
  return useQuery({
    queryKey: ["drivers", id],
    queryFn: () => fetchDriverById(id),
    enabled: !!id,
  });
};

// ── Approve driver application ─────────────────────────────────────────
const approveDriver = async (driverId: string) => {
  const { data } = await api.patch(`/admin/drivers/${driverId}/approve`);
  return data.data ?? data;
};

export const useApproveDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

// ── Reject driver application ──────────────────────────────────────────
const rejectDriver = async (driverId: string) => {
  const { data } = await api.patch(`/admin/drivers/${driverId}/reject`);
  return data.data ?? data;
};

export const useRejectDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

// ── Suspend driver ─────────────────────────────────────────────────────
const suspendDriver = async (driverId: string) => {
  const { data } = await api.patch(`/admin/drivers/${driverId}/suspend`);
  return data.data ?? data;
};

export const useSuspendDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: suspendDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

// ── Unsuspend driver ───────────────────────────────────────────────────
const unsuspendDriver = async (driverId: string) => {
  const { data } = await api.patch(`/admin/drivers/${driverId}/unsuspend`);
  return data.data ?? data;
};

export const useUnsuspendDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unsuspendDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

// ── Delete driver ──────────────────────────────────────────────────────
const deleteDriver = async (driverId: string) => {
  const { data } = await api.delete(`/admin/drivers/${driverId}`);
  return data.data ?? data;
};

export const useDeleteDriver = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      navigate("/drivers");
    },
  });
};

// ── Verify Driver Document ─────────────────────────────────────────────
const verifyDocument = async (docId: string) => {
  const { data } = await api.patch(`/admin/drivers/documents/${docId}/verify`);
  return data.data ?? data;
};

export const useVerifyDocument = (driverId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verifyDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers", driverId] });
    },
  });
};

// ── Reject Driver Document ──────────────────────────────────────────────
const rejectDocument = async ({
  docId,
  reason,
}: {
  docId: string;
  reason: string;
}) => {
  const { data } = await api.patch(`/admin/drivers/documents/${docId}/reject`, {
    reason,
  });
  return data.data ?? data;
};

export const useRejectDocument = (driverId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers", driverId] });
    },
  });
};

// ── Fetch Driver Wallet ───────────────────────────────────────────────
const fetchDriverWallet = async (driverId: string) => {
  const { data } = await api.get(`/admin/drivers/${driverId}/wallet`);
  return data.data ?? data;
};

export const useDriverWallet = (driverId: string) => {
  return useQuery({
    queryKey: ["drivers", driverId, "wallet"],
    queryFn: () => fetchDriverWallet(driverId),
    enabled: !!driverId,
  });
};

// ── Top up Driver Wallet ──────────────────────────────────────────────
const topUpWallet = async ({
  driverId,
  amount,
  note,
}: {
  driverId: string;
  amount: number;
  note?: string;
}) => {
  const { data } = await api.post(`/admin/drivers/${driverId}/wallet/topup`, {
    amount,
    note,
  });
  return data.data ?? data;
};

export const useTopUpWallet = (driverId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: topUpWallet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers", driverId] });
      qc.invalidateQueries({ queryKey: ["drivers", driverId, "wallet"] });
    },
  });
};

// ── Debit Driver Wallet ───────────────────────────────────────────────
const debitWallet = async ({
  driverId,
  amount,
  note,
}: {
  driverId: string;
  amount: number;
  note?: string;
}) => {
  const { data } = await api.post(`/admin/drivers/${driverId}/wallet/debit`, {
    amount,
    note,
  });
  return data.data ?? data;
};

export const useDebitWallet = (driverId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: debitWallet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers", driverId] });
      qc.invalidateQueries({ queryKey: ["drivers", driverId, "wallet"] });
    },
  });
};

// ── Update Driver Credit Limit ────────────────────────────────────────
const updateCreditLimit = async ({
  driverId,
  creditLimit,
}: {
  driverId: string;
  creditLimit: number;
}) => {
  const { data } = await api.patch(
    `/admin/drivers/${driverId}/wallet/credit-limit`,
    { creditLimit },
  );
  return data.data ?? data;
};

export const useUpdateCreditLimit = (driverId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCreditLimit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers", driverId, "wallet"] });
    },
  });
};
