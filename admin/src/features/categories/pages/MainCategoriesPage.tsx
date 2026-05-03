import { useState } from "react";
import { Plus } from "lucide-react";
import { useMainCategories } from "../api/category.api";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import MainCategoriesTable from "../components/MainCategoriesTable";
import CategoryModal from "../components/CategoryModal";

export default function MainCategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useMainCategories();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage main categories for your marketplace
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <MainCategoriesTable categories={categories ?? []} />

      {showCreateModal && (
        <CategoryModal
          editingCategory={null}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
