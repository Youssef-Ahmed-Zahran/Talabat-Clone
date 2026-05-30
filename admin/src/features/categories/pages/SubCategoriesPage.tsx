import { Link } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import SubCategoriesTable from "../components/sub-category/SubCategoriesTable";
import SubCategoryModal from "../components/sub-category/SubCategoryModal";
import LinkStoreModal from "../components/sub-category/LinkStoreModal";
import LinkedStoresModal from "../components/sub-category/LinkedStoresModal";
import { useSubCategoriesPage } from "../hooks/useSubCategoriesPage";

export default function SubCategoriesPage() {
  const { query, modal, actions } = useSubCategoriesPage();

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
          onClick={modal.sub.openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Sub-Category
        </button>
      </div>

      <SubCategoriesTable
        subCategories={query.subCategories ?? []}
        categoryId={query.categoryId}
        onEdit={modal.sub.openEdit}
        onDelete={actions.sub.delete}
        onLink={modal.stores.openLink}
        onViewStores={modal.stores.openView}
        isDeleting={actions.sub.isDeletePending}
      />

      {(modal.state.type === "SUB_CREATE" ||
        modal.state.type === "SUB_EDIT") && (
        <SubCategoryModal
          isOpen={true}
          editingSub={
            modal.state.type === "SUB_EDIT" ? modal.state.subCategory : null
          }
          onClose={modal.close}
          onSubmit={actions.sub.submit}
          isPending={actions.sub.isPending}
        />
      )}

      {modal.state.type === "LINK_STORE" && (
        <LinkStoreModal
          onClose={modal.close}
          onSubmit={actions.stores.link}
          isPending={actions.stores.isLinkPending}
        />
      )}

      {modal.state.type === "LINKED_STORES" && (
        <LinkedStoresModal
          subCategoryId={modal.state.subId}
          onClose={modal.close}
          onUnlink={actions.stores.unlink}
          isUnlinkPending={actions.stores.isUnlinkPending}
        />
      )}
    </div>
  );
}
