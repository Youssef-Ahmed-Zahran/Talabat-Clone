import { useEffect, useState } from "react";
import { useClearTimeout } from "../../../hooks/useClearTimeout";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import {
  productSchema,
  type ProductFormValues,
} from "../../../schemas/catalog.schema";
import type { Product, Section, CreateProductPayload } from "../../../types";
import { useCreateProduct, useUpdateProduct } from "../api/catalog.api";
import { OptionValuesBuilder } from "./OptionValuesBuilder";
import { handleApiError } from "../../../utils/error";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  sections?: Section[];
  activeSectionId: string | null;
  // ✅ Moved down: modal now owns mutations, needs storeId
  storeId: string;
}

export function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  sections,
  activeSectionId,
  storeId,
}: ProductModalProps) {
  // ✅ Moved down: mutations live here now, not in the parent page
  const createProductMut = useCreateProduct(storeId);
  const updateProductMut = useUpdateProduct(storeId);
  const isPending = createProductMut.isPending || updateProductMut.isPending;

  useClearTimeout(onClose, isOpen);

  const [newMetaKey, setNewMetaKey] = useState("");
  const [newMetaValue, setNewMetaValue] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    values: editingProduct
      ? {
          name: editingProduct.name,
          description: editingProduct.description || "",
          price: Number(editingProduct.price),
          quantity:
            editingProduct.quantity != null
              ? Number(editingProduct.quantity)
              : "",
          sectionId: editingProduct.section_id || "",
          meta: editingProduct.meta || {},
          optionGroups:
            editingProduct.option_groups?.map((g) => ({
              name: g.name,
              isRequired: g.is_required,
              minSelect: g.min_select,
              maxSelect: g.max_select,
              values:
                g.values?.map((v) => ({
                  name: v.name,
                  extraPrice: v.extra_price,
                })) || [],
            })) || [],
        }
      : {
          name: "",
          description: "",
          price: 0,
          quantity: "",
          sectionId: activeSectionId || "",
          meta: {},
          optionGroups: [],
        },
  });

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: "optionGroups",
  });

  const currentMeta = watch("meta") || {};

  useEffect(() => {
    setNewMetaKey("");
    setNewMetaValue("");
  }, [editingProduct, isOpen]);

  const handleAddMeta = () => {
    if (newMetaKey.trim() && newMetaValue.trim()) {
      setValue("meta", {
        ...currentMeta,
        [newMetaKey.trim()]: newMetaValue.trim(),
      });
      setNewMetaKey("");
      setNewMetaValue("");
    } else {
      toast.error("Both key and value are required");
    }
  };

  // ✅ Moved down: handleSaveProduct is fully encapsulated here
  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProductMut.mutate(
        {
          productId: editingProduct.id,
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          price: Number(data.price),
          quantity: data.quantity !== "" ? Number(data.quantity) : undefined,
          sectionId: data.sectionId || undefined,
          meta: data.meta,
          // Note: Backend typically handles option groups separately for updates
          // to avoid complex merging logic, but we include it here for consistency
        },
        {
          onSuccess: () => {
            toast.success("Product updated");
            onClose();
          },
          onError: (err) =>
            handleApiError(
              err,
              "We couldn't update the product details. Please try again.",
            ),
        },
      );
    } else {
      const payload: CreateProductPayload = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        price: Number(data.price),
        quantity: data.quantity !== "" ? Number(data.quantity) : undefined,
        sectionId: data.sectionId || undefined,
        meta: data.meta,
        optionGroups: data.optionGroups,
      };
      createProductMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Product created");
          onClose();
        },
        onError: (err) =>
          handleApiError(
            err,
            "We couldn't add the new product. Please try again.",
          ),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingProduct ? "Edit Product" : "Create Product"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="e.g. Classic Cheeseburger"
                className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.name ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
                autoFocus
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={2}
                placeholder="Brief description..."
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Price (EGP) *
                </label>
                <input
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="0.00"
                  step="0.01"
                  className={`w-full px-4 py-2.5 text-sm bg-white border ${errors.price ? "border-red-500" : "border-gray-200"} rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all`}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  {...register("quantity", {
                    setValueAs: (v) =>
                      v === "" || v === null ? "" : Number(v),
                  })}
                  placeholder="Unlimited"
                  min="0"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Section
              </label>
              <select
                {...register("sectionId")}
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              >
                <option value="">No section</option>
                {sections?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modifiers (Option Groups) Builder */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Modifiers (Option Groups)
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    Add choices like Size, Toppings, or Extras.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    appendGroup({ name: "", isRequired: false, values: [] })
                  }
                  className="p-1.5 text-brand bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {groupFields.map((field, groupIndex) => (
                  <div
                    key={field.id}
                    className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        {...register(`optionGroups.${groupIndex}.name`)}
                        placeholder="Group Name (e.g. Size)"
                        className="flex-1 px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register(`optionGroups.${groupIndex}.isRequired`)}
                          className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <span className="text-[12px] text-gray-600 font-medium whitespace-nowrap">
                          Required
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeGroup(groupIndex)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Nested Values Builder */}
                    <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                      <OptionValuesBuilder
                        control={control}
                        groupIndex={groupIndex}
                        register={register}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Metadata Builder */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Custom Metadata
              </h3>
              <p className="text-[12px] text-gray-500 mb-3">
                Add any dynamic attributes like processor, color, material, etc.
              </p>
              <div className="space-y-3">
                {Object.entries(currentMeta).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={k}
                      disabled
                      className="w-1/3 px-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                    />
                    <input
                      type="text"
                      value={String(v)}
                      onChange={(e) =>
                        setValue("meta", {
                          ...currentMeta,
                          [k]: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newMeta = { ...currentMeta };
                        delete newMeta[k];
                        setValue("meta", newMeta);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. processor"
                    value={newMetaKey}
                    onChange={(e) => setNewMetaKey(e.target.value)}
                    className="w-1/3 px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="e.g. intel core i7"
                    value={newMetaValue}
                    onChange={(e) => setNewMetaValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddMeta();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddMeta}
                    className="p-2 text-brand bg-brand-50 hover:bg-brand-100 rounded-lg font-semibold flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
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
              {editingProduct ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
