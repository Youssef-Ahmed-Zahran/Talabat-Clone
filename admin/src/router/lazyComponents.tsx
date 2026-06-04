import { lazy } from "react";

export const StoresListPage = lazy(
  () => import("../features/stores/pages/StoresListPage"),
);
export const StoreDetailsPage = lazy(
  () => import("../features/stores/pages/StoreDetailsPage"),
);
export const StoreCatalogPage = lazy(
  () => import("../features/catalog/pages/StoreCatalogPage"),
);

export const ZonesPage = lazy(
  () => import("../features/zones/pages/ZonesPage"),
);
export const ZoneEditorPage = lazy(
  () => import("../features/zones/pages/ZoneEditorPage"),
);
