import {
  Plus,
  Layers3,
  LayoutGrid,
  Pencil,
  Trash2,
  Loader2,
  Search,
  X,
} from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import Pagination from "../../../components/pagination/Pagination";
import CategoryModal from "../components/main-category/CategoryModal";
import SubCategoryModal from "../components/sub-category/SubCategoryModal";
import LinkStoreModal from "../components/sub-category/LinkStoreModal";
import LinkedStoresModal from "../components/sub-category/LinkedStoresModal";
import SubCategoriesTable from "../components/sub-category/SubCategoriesTable";
import { useMainCategoriesPage } from "../hooks/useMainCategoriesPage";

export default function MainCategoriesPage() {
  const { query, state, modal, actions } = useMainCategoriesPage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your marketplace hierarchy in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={modal.main.openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Main Category
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        {/* ── Main Categories List (Left) ────────────────────────────── */}
        <div className="w-full lg:w-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Main Categories
            </h2>
            {query.isFetching && (
              <Loader2 className="w-4 h-4 text-brand animate-spin" />
            )}
          </div>

          {/* Search input */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={state.search}
                onChange={(e) => {
                  state.setSearch(e.target.value);
                  state.setPage(1);
                }}
                placeholder="Search categories…"
                className="w-full pl-8 pr-7 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all placeholder:text-gray-400"
              />
              {state.search && (
                <button
                  onClick={() => {
                    state.setSearch("");
                    state.setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[700px] overflow-y-auto relative">
            {query.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-brand animate-spin" />
              </div>
            ) : query.categories?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-500">
                  No categories found
                </p>
                {state.search && (
                  <p className="text-xs text-gray-400 mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              query.categories?.map((cat) => (
                <div
                  key={cat.id}
                  className={`relative flex items-center justify-between transition-all group ${
                    state.selectedCategoryId === cat.id
                      ? "bg-brand/5"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Clickable selection area */}
                  <button
                    onClick={() => state.setSelectedCategoryId(cat.id)}
                    className="flex-1 flex items-center gap-3 p-4 text-left min-w-0"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border ${state.selectedCategoryId === cat.id ? "border-brand/20 bg-white" : "border-gray-100 bg-gray-50"}`}
                    >
                      {cat.imageUrl || cat.image ? (
                        <img
                          src={cat.imageUrl || cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Layers3
                          className={`w-5 h-5 ${state.selectedCategoryId === cat.id ? "text-brand" : "text-gray-400"}`}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${state.selectedCategoryId === cat.id ? "text-brand" : "text-gray-900"}`}
                      >
                        {cat.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {cat.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </button>

                  {/* Action buttons (show on hover or when selected) */}
                  <div
                    className={`flex items-center gap-1 pr-3 shrink-0 transition-opacity duration-150 ${
                      state.selectedCategoryId === cat.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        modal.main.openEdit(cat);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                      title="Edit category"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.main.delete(cat);
                      }}
                      disabled={actions.main.isDeletePending}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete category"
                    >
                      {actions.main.isDeletePending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {query.pagination && (
            <div className="border-t border-gray-50 bg-white p-2">
              <Pagination
                currentPage={state.page}
                totalPages={query.pagination.totalPages}
                onPageChange={state.setPage}
                totalItems={query.pagination.total}
                itemsPerPage={state.limit}
              />
            </div>
          )}
        </div>

        {/* ── Sub-Categories Content (Right) ────────────────────────── */}
        <div className="flex-1 min-w-0">
          {state.selectedCategoryId ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {query.selectedCategory?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Sub-categories under this group
                    </p>
                  </div>
                </div>
                <button
                  onClick={modal.sub.openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Sub
                </button>
              </div>

              {query.subLoading ? (
                <div className="py-20 flex justify-center">
                  <PageLoader />
                </div>
              ) : (
                <SubCategoriesTable
                  subCategories={query.subCategories ?? []}
                  categoryId={state.selectedCategoryId}
                  onEdit={modal.sub.openEdit}
                  onDelete={actions.sub.delete}
                  onLink={modal.stores.openLink}
                  onViewStores={modal.stores.openView}
                  isDeleting={actions.sub.isDeletePending}
                />
              )}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <Layers3 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-600">
                No Category Selected
              </h3>
              <p className="text-[13px] text-gray-400 mt-1 max-w-[240px]">
                Select a main category from the left to manage its
                sub-categories.
              </p>
            </div>
          )}
        </div>
      </div>

      {(modal.state.type === "MAIN_CREATE" ||
        modal.state.type === "MAIN_EDIT") && (
        <CategoryModal
          isOpen={true}
          editingCategory={
            modal.state.type === "MAIN_EDIT" ? modal.state.category : null
          }
          onClose={modal.close}
          onSubmit={actions.main.submit}
          isPending={actions.main.isPending}
        />
      )}

      {(modal.state.type === "SUB_CREATE" || modal.state.type === "SUB_EDIT") &&
        state.selectedCategoryId && (
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
