import { lazy } from "react";

export const StoreDetailsPage = lazy(
  () => import("../features/stores/pages/StoreDetailsPage"),
);
export const StoreCatalogPage = lazy(
  () => import("../features/catalog/pages/StoreCatalogPage"),
);
