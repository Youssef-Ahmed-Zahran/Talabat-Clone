import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useCountries } from "../api/location.api";
import { useLocationStore } from "@src/store/locationStore";
import type { Country } from "@src/features/location/types/geography.types";
import { UseCountrySelectionReturn } from "../types/location.types";
export function useCountrySelection(): UseCountrySelectionReturn {
  const router = useRouter();
  const setCountry = useLocationStore((s) => s.setCountry);
  const { data: countries, isLoading } = useCountries();

  const handleSelectCountry = useCallback(
    async (country: Country) => {
      await setCountry(country.code, country.name);
      router.push({
        pathname: "/location/map-picking",
        params: { countryCode: country.code, countryName: country.name },
      });
    },
    [setCountry, router],
  );

  return {
    query: { countries, isLoading },
    actions: { handleSelectCountry },
  };
}
