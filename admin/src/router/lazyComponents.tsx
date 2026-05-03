import { lazy } from "react";

export const StoresListPage = lazy(
  () => import("../features/stores/pages/StoresListPage"),
);
export const StoreDetailsPage = lazy(
  () => import("../features/stores/pages/StoreDetailsPage"),
);
