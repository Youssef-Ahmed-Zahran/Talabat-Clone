import { useClearTimeout } from "../../../hooks/useClearTimeout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  sectionSchema,
  type SectionFormValues,
} from "../../../schemas/catalog.schema";
import type { Section } from "../../../types";
import { useCreateSection, useUpdateSection } from "../api/catalog.api";
import { handleApiError } from "../../../utils/error";

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSection: Section | null;
  // ✅ Moved down: modal now owns mutations, needs storeId + sectionsCount
  storeId: string;
  sectionsCount: number;
  onSuccess: () => void;
}

export function SectionModal({
  isOpen,
  onClose,
  editingSection,
  storeId,
  sectionsCount,
  onSuccess,
}: SectionModalProps) {
  // ✅ Moved down: mutations live here now, not in the parent page
  const createSectionMut = useCreateSection(storeId);
  const updateSectionMut = useUpdateSection(storeId);
  const isPending = createSectionMut.isPending || updateSectionMut.isPending;

  useClearTimeout(onClose, isOpen);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    values: editingSection ? { name: editingSection.name } : { name: "" },
  });

  // ✅ Moved down: handleSaveSection is fully encapsulated here
  const onSubmit = (data: SectionFormValues) => {
    if (editingSection) {
      updateSectionMut.mutate(
        { sectionId: editingSection.id, name: data.name.trim() },
        {
          onSuccess: () => {
            toast.success("Section updated");
            onClose();
            onSuccess();
          },
          onError: (err) =>
            handleApiError(
              err,
              "We couldn't update this section. Please try again.",
            ),
        },
      );
    } else {
      createSectionMut.mutate(
        { name: data.name.trim(), sortOrder: sectionsCount },
        {
          onSuccess: () => {
            toast.success("Section created");
            onClose();
            onSuccess();
          },
          onError: (err) =>
            handleApiError(
              err,
              "We couldn't create the section. Please try again.",
            ),
        },
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingSection ? "Edit Section" : "Create Section"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Section Name *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Burgers, Drinks, Desserts..."
              className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.name ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingSection ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
