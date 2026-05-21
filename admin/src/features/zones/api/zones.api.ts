import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/axios";

// ── Types ─────────────────────────────────────────────────────

export interface Zone {
  id: string;
  name: string;
  cityId: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  city?: { id: string; name: string };
  _count?: { storeZones: number; driverZones: number };
  boundary?: GeoJSONPolygon | null;
  storeZones?: {
    id: string;
    storeId: string;
    zoneId: string;
    store: { id: string; name: string; logoUrl?: string; isActive: boolean };
  }[];
  driverZones?: {
    id: string;
    driverId: string;
    zoneId: string;
    driver: {
      id: string;
      phone: string;
      isOnline: boolean;
      status: string;
      application?: { firstName: string; familyName: string; profilePhotoUrl?: string } | null;
    };
  }[];
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface ZoneStore {
  id: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
  city?: { name: string };
}

// ── Zone CRUD ─────────────────────────────────────────────────

export const fetchAllZones = async (cityId?: string): Promise<Zone[]> => {
  const params: Record<string, string> = { includeGeometry: "true" };
  if (cityId) params.cityId = cityId;
  const res = await api.get("/zones", { params });
  return res.data.data;
};

export const fetchZoneById = async (id: string): Promise<Zone> => {
  const res = await api.get(`/zones/${id}`);
  return res.data.data;
};

export const detectZone = async (lat: number, lng: number) => {
  const res = await api.get("/zones/detect", { params: { lat, lng } });
  return res.data.data;
};

export const createZone = async (data: {
  name: string;
  cityId: string;
  description?: string;
  color?: string;
  geojson: GeoJSONPolygon;
}): Promise<Zone> => {
  const res = await api.post("/zones", data);
  return res.data.data;
};

export const updateZone = async (
  id: string,
  data: Partial<{
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    geojson: GeoJSONPolygon;
  }>
): Promise<Zone> => {
  const res = await api.put(`/zones/${id}`, data);
  return res.data.data;
};

export const deleteZone = async (id: string): Promise<void> => {
  await api.delete(`/zones/${id}`);
};

// ── Zone ↔ Store assignments ──────────────────────────────────

export const assignStoresToZone = async (zoneId: string, storeIds: string[]) => {
  const res = await api.post(`/zones/${zoneId}/stores`, { storeIds });
  return res.data.data;
};

export const removeStoreFromZone = async (zoneId: string, storeId: string) => {
  await api.delete(`/zones/${zoneId}/stores/${storeId}`);
};

// ── Stores (for assignment modal) ─────────────────────────────

export const fetchStores = async (search?: string) => {
  const res = await api.get("/stores/admin", {
    params: search ? { search } : undefined,
  });
  return res.data.data.stores || res.data.data;
};

// ── Cities (for zone creation) ────────────────────────────────
export const fetchCities = async (countryCode: string) => {
  if (!countryCode) return [];
  const res = await api.get(`/geography/countries/${countryCode}/cities`);
  return res.data.data as { id: string; name: string; countryId: string }[];
};

// ── Countries ─────────────────────────────────────────────────
export const fetchCountries = async () => {
  const res = await api.get("/geography/countries");
  return res.data.data as { id: string; name: string; code: string }[];
};

// ── Zone ↔ Driver assignments ─────────────────────────────────

export const assignDriversToZone = async (zoneId: string, driverIds: string[]) => {
  const res = await api.post(`/zones/${zoneId}/drivers`, { driverIds });
  return res.data.data;
};

export const removeDriverFromZone = async (zoneId: string, driverId: string) => {
  await api.delete(`/zones/${zoneId}/drivers/${driverId}`);
};

// ── Drivers (for assignment tab) ──────────────────────────────

export interface ZoneDriver {
  id: string;
  phone: string;
  isOnline: boolean;
  status: string;
  application?: { firstName: string; familyName: string; profilePhotoUrl?: string } | null;
}

export const fetchDrivers = async (search?: string): Promise<ZoneDriver[]> => {
  const res = await api.get("/admin/drivers", {
    params: search ? { search } : undefined,
  });
  // Admin response shape: { drivers: [...], pagination: {...} }
  return res.data.data?.drivers || res.data.data || [];
};

// ── React Query Hooks ──────────────────────────────────────────

export const useZones = (cityId?: string) => {
  return useQuery<Zone[]>({
    queryKey: ["zones", { cityId }],
    queryFn: () => fetchAllZones(cityId),
  });
};

export const useZone = (id: string) => {
  return useQuery<Zone>({
    queryKey: ["zones", "detail", id],
    queryFn: () => fetchZoneById(id),
    enabled: !!id,
  });
};

export const useCreateZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
    },
  });
};

export const useUpdateZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      color?: string;
      isActive?: boolean;
      geojson?: GeoJSONPolygon;
    }) => updateZone(id, data),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["zones", "detail", variables.id] });
    },
  });
};

export const useDeleteZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteZone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
    },
  });
};

export const useAssignStoresToZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, storeIds }: { zoneId: string; storeIds: string[] }) =>
      assignStoresToZone(zoneId, storeIds),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["zones", "detail", variables.zoneId] });
    },
  });
};

export const useRemoveStoreFromZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, storeId }: { zoneId: string; storeId: string }) =>
      removeStoreFromZone(zoneId, storeId),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["zones", "detail", variables.zoneId] });
    },
  });
};

export const useAssignDriversToZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, driverIds }: { zoneId: string; driverIds: string[] }) =>
      assignDriversToZone(zoneId, driverIds),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["zones", "detail", variables.zoneId] });
    },
  });
};

export const useRemoveDriverFromZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, driverId }: { zoneId: string; driverId: string }) =>
      removeDriverFromZone(zoneId, driverId),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["zones", "detail", variables.zoneId] });
    },
  });
};


