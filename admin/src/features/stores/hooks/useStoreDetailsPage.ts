import { useParams, useNavigate } from "react-router-dom";
import { useStoreDetails } from "../api/store.api";
import { useAuthStore } from "../../../store/authStore";

export function useStoreDetailsPage() {
  const params = useParams<{ storeId?: string }>();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const authStoreId = useAuthStore((s) => s.storeId);
  const storeId = params.storeId || authStoreId || "";

  const { data: store, isLoading, isError, refetch } = useStoreDetails(storeId);

  return {
    role,
    storeId,
    store,
    isLoading,
    isError,
    refetch,
    navigate,
  };
}
