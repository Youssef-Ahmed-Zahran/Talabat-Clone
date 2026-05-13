import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, Plus, Info, Settings2, Package } from "lucide-react";
import toast from "react-hot-toast";
import {
  productSchema,
  type ProductFormValues,
} from "../../../schemas/catalog.schema";
import type { Product, Section, CreateProductPayload } from "../../../types";
import { useCreateProduct, useUpdateProduct } from "../api/catalog.api";
import { OptionValuesBuilder } from "./OptionValuesBuilder";
import { handleApiError } from "../../../utils/error";
import { SlideOver } from "../../../components/layout/SlideOver";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  sections?: Section[];
  activeSectionId: string | null;
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
  const createProductMut = useCreateProduct(storeId);
  const updateProductMut = useUpdateProduct(storeId);
  const isPending = createProductMut.isPending || updateProductMut.isPending;

  const [activeTab, setActiveTab] = useState<"details" | "custom">("details");
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

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync state during render to avoid cascading renders
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setActiveTab("details");
    setNewMetaKey("");
    setNewMetaValue("");
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

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
        },
        {
          onSuccess: () => {
            toast.success("Product updated");
            onClose();
          },
          onError: (err) => handleApiError(err, "Couldn't update product."),
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
        onError: (err) => handleApiError(err, "Couldn't create product."),
      });
    }
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? "Edit Product" : "New Product"}
      description="Configure pricing, availability and customization options."
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            {editingProduct ? "Update Product" : "Create Product"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex p-1 bg-gray-100 rounded-2xl">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "details" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Info className="w-4 h-4" /> Details
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "custom" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Settings2 className="w-4 h-4" /> Customization
          </button>
        </div>

        {activeTab === "details" ? (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                  Product Name *
                </label>
                <input
                  {...register("name")}
                  placeholder="e.g. Double Beef Burger"
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? "border-red-500" : "border-gray-100"} rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all font-medium`}
                />
                {errors.name && (
                  <p className="text-red-500 text-[11px] mt-1 ml-2 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Tell customers more about this item..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand/5 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Price (EGP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-brand"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                    Inventory Qty
                  </label>
                  <input
                    type="number"
                    {...register("quantity", {
                      setValueAs: (v) => (v === "" ? "" : Number(v)),
                    })}
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">
                  Menu Category
                </label>
                <select
                  {...register("sectionId")}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl appearance-none"
                >
                  <option value="">Ungrouped</option>
                  {sections?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-gray-900">
                  Add-ons & Modifiers
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    appendGroup({ name: "", isRequired: false, values: [] })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand/5 text-brand text-xs font-bold rounded-xl hover:bg-brand/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Group
                </button>
              </div>

              <div className="space-y-4">
                {groupFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        {...register(`optionGroups.${idx}.name`)}
                        placeholder="Group Name (e.g. Toppings)"
                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register(`optionGroups.${idx}.isRequired`)}
                          className="w-4 h-4 rounded text-brand focus:ring-brand"
                        />
                        <span className="text-xs font-bold text-gray-500">
                          Required
                        </span>
                      </label>
                      <button
                        onClick={() => removeGroup(idx)}
                        className="p-1.5 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pl-4 border-l-2 border-gray-200">
                      <OptionValuesBuilder
                        control={control}
                        groupIndex={idx}
                        register={register}
                      />
                    </div>
                  </div>
                ))}
                {groupFields.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-3xl">
                    <p className="text-xs text-gray-400 font-medium">
                      No modifiers added yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 px-1">
                Dynamic Attributes
              </h3>
              <div className="space-y-3">
                {Object.entries(currentMeta).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 group">
                    <div className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-600 uppercase tracking-tight">
                      {k}
                    </div>
                    <input
                      className="flex-[2] px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand/5 outline-none"
                      value={String(v)}
                      onChange={(e) =>
                        setValue("meta", {
                          ...currentMeta,
                          [k]: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={() => {
                        const nm = { ...currentMeta };
                        delete nm[k];
                        setValue("meta", nm);
                      }}
                      className="p-2 text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    placeholder="Key"
                    value={newMetaKey}
                    onChange={(e) => setNewMetaKey(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    placeholder="Value"
                    value={newMetaValue}
                    onChange={(e) => setNewMetaValue(e.target.value)}
                    className="flex-[2] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                  />
                  <button
                    onClick={handleAddMeta}
                    className="p-3 bg-brand/10 text-brand rounded-xl hover:bg-brand hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SlideOver>
  );
}
