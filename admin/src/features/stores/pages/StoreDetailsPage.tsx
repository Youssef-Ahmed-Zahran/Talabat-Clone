import { Link } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { StoreHero } from "../components/StoreHero";
import { StoreInfoCards } from "../components/StoreInfoCards";
import { useStoreDetailsPage } from "../hooks/useStoreDetailsPage";

export default function StoreDetailsPage() {
  const {
    role,
    storeId,
    store,
    isLoading,
    isError,
    refetch,
    navigate,
  } = useStoreDetailsPage();

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;
  if (!store)
    return <div className="p-8 text-center text-gray-500">Store not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {role !== "owner" && (
            <button
              onClick={() => navigate("/stores")}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Store Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Viewing full information for {store.name}
            </p>
          </div>
        </div>
        <Link
          to={
            role === "owner"
              ? `/my-store/catalog`
              : `/stores/${storeId}/catalog`
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Package className="w-4 h-4" />
          Manage Catalog
        </Link>
      </div>

      <StoreHero store={store} />
      <StoreInfoCards store={store} />
    </div>
  );
}
