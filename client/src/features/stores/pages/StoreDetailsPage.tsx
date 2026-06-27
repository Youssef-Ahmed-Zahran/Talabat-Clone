import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Settings, RefreshCw } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { StoreHero } from "../components/store-detail/StoreHero";
import { StoreInfoCards } from "../components/store-detail/StoreInfoCards";
import { useStoreDetailsPage } from "../hooks/useStoreDetailsPage";
import { ClientStoreEditModal } from "../components/modals/ClientStoreEditModal";

export default function StoreDetailsPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { query, router } = useStoreDetailsPage();

  if (query.isLoading) return <PageLoader />;
  if (query.isError) return <ErrorFallback onRetry={query.refetch} />;
  if (!query.store)
    return <div className="p-8 text-center text-gray-500">Store not found</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {query.role !== "owner" && (
            <button
              onClick={() => router.navigate("/stores")}
              className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-600 bg-white border border-gray-200/80 hover:border-gray-300/50 hover:bg-gray-50 transition-all duration-200 premium-shadow"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Store Details
            </h1>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5">
              Viewing full information for {query.store.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-200/80 rounded-2xl hover:bg-gray-50 transition-all premium-shadow disabled:opacity-50"
            title="Refresh details"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${query.isFetching ? "animate-spin" : ""}`}
            />
          </button>
          {query.role === "owner" && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200/80 rounded-2xl hover:bg-gray-50 transition-all premium-shadow active:scale-95"
            >
              <Settings className="w-4 h-4 text-gray-500" />
              Store Settings
            </button>
          )}
          <Link
            to={
              query.role === "owner"
                ? `/my-store/catalog`
                : `/stores/${query.storeId}/catalog`
            }
            className="inline-flex items-center gap-2 px-4.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand to-brand-light rounded-2xl hover:shadow-lg hover:shadow-brand/15 transition-all active:scale-95"
          >
            <Package className="w-4 h-4" />
            Manage Catalog
          </Link>
        </div>
      </div>

      <StoreHero store={query.store} />
      <StoreInfoCards store={query.store} />

      <ClientStoreEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        store={query.store}
      />
    </div>
  );
}
