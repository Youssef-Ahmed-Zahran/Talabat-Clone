import { useState } from "react";
import {
  Layers3,
  Link2,
  Pencil,
  Trash2,
  Store as StoreIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDeleteSubCategory } from "../api/category.api";
import type { Category } from "../../../types";
import SubCategoryModal from "./SubCategoryModal";
import LinkStoreModal from "./LinkStoreModal";
import LinkedStoresModal from "./LinkedStoresModal";

interface SubCategoriesTableProps {
  subCategories: Category[];
  categoryId: string;
}

export default function SubCategoriesTable({
  subCategories,
  categoryId,
}: SubCategoriesTableProps) {
  const deleteSubMutation = useDeleteSubCategory();

  const [editingSub, setEditingSub] = useState<Category | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showLinkedStoresModal, setShowLinkedStoresModal] = useState(false);

  const openEdit = (sub: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSub(sub);
    setShowEditModal(true);
  };

  const handleDelete = (sub: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete ${sub.name}? This will unlink all stores from this sub-category.`,
      )
    ) {
      deleteSubMutation.mutate(sub.id, {
        onSuccess: () => toast.success("Sub-category deleted"),
        onError: () => toast.error("Failed to delete sub-category"),
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Sub-Category
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Created
              </th>
              <th className="text-right px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subCategories.length > 0 ? (
              subCategories.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                        {sub.imageUrl || sub.image ? (
                          <img
                            src={sub.imageUrl || sub.image}
                            alt={sub.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Layers3 className="w-4 h-4 text-indigo-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {sub.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${sub.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {sub.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          setShowLinkedStoresModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-brand bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                        title="View Linked Stores"
                      >
                        <StoreIcon className="w-3.5 h-3.5" />
                        Stores
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubId(sub.id);
                          setShowLinkModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Link Store"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Link
                      </button>
                      <button
                        onClick={(e) => openEdit(sub, e)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors ml-2"
                        title="Edit Sub-Category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(sub, e)}
                        disabled={deleteSubMutation.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Sub-Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-16 text-center text-sm text-gray-400"
                >
                  No sub-categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <SubCategoryModal
          isOpen={true}
          categoryId={categoryId}
          editingSub={editingSub}
          onClose={() => {
            setShowEditModal(false);
            setEditingSub(null);
          }}
        />
      )}

      {/* Link Store Modal */}
      {showLinkModal && selectedSubId && (
        <LinkStoreModal
          subCategoryId={selectedSubId}
          onClose={() => setShowLinkModal(false)}
        />
      )}

      {/* Linked Stores Modal */}
      {showLinkedStoresModal && selectedSubId && (
        <LinkedStoresModal
          subCategoryId={selectedSubId}
          onClose={() => setShowLinkedStoresModal(false)}
        />
      )}
    </>
  );
}
