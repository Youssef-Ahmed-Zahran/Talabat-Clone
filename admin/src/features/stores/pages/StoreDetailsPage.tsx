import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Settings } from "lucide-react";
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
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {query.role !== "owner" && (
            <button
              onClick={() => router.navigate("/stores")}
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
              Viewing full information for {query.store.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {query.role === "owner" && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Store Settings
            </button>
          )}
          <Link
            to={
              query.role === "owner"
                ? `/my-store/catalog`
                : `/stores/${query.storeId}/catalog`
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
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
