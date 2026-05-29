import { Link } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import SubCategoriesTable from "../components/sub-category/SubCategoriesTable";
import SubCategoryModal from "../components/sub-category/SubCategoryModal";
import { useSubCategoriesPage } from "../hooks/useSubCategoriesPage";

export default function SubCategoriesPage() {
  const { query, modal } = useSubCategoriesPage();

  if (query.isLoading) return <PageLoader />;
  if (query.isError) return <ErrorFallback onRetry={query.refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/categories"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sub-Categories
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage sub-categories under this parent
            </p>
          </div>
        </div>
        <button
          onClick={() => modal.setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Sub-Category
        </button>
      </div>

      {/* Table — owns all row-level state & modals */}
      <SubCategoriesTable
        subCategories={query.subCategories ?? []}
        categoryId={query.categoryId}
      />

      {/* Create modal — owned by the page (triggered from the header) */}
      {modal.showCreateModal && (
        <SubCategoryModal
          isOpen={modal.showCreateModal}
          categoryId={query.categoryId}
          editingSub={null}
          onClose={() => modal.setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
