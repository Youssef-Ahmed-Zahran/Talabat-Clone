import { useQuery } from "@tanstack/react-query";
import api from "@src/config/axios";
import type {
  Country,
  City,
} from "@src/features/location/types/geography.types";
import type { ApiResponse } from "@src/types/api.types";

// ─── Get Countries ────────────────────────────────────────────
export const useCountries = (search?: string) => {
  return useQuery({
    queryKey: ["countries", search],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Country[]>>(
        "/geography/countries",
        {
          params: search ? { search } : undefined,
        },
      );
      return res.data.data;
    },
  });
};

// ─── Get Cities by Country Code ───────────────────────────────
export const useCities = (countryCode: string, search?: string) => {
  return useQuery({
    queryKey: ["cities", countryCode, search],
    queryFn: async () => {
      const res = await api.get<ApiResponse<City[]>>(
        `/geography/countries/${countryCode}/cities`,
        { params: search ? { search } : undefined },
      );
      return res.data.data;
    },
    enabled: !!countryCode,
  });
};
