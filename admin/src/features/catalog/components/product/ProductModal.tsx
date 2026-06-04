import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Settings2 } from "lucide-react";
import {
  productSchema,
  type ProductFormValues,
} from "../../../../schemas/catalog.schema";
import type { Product, Section } from "../../../../types";
import { SlideOver } from "../../../../components/layout/SlideOver";
import { ProductDetailsTab } from "./tabs/ProductDetailsTab";
import { ProductCustomizationTab } from "./tabs/ProductCustomizationTab";
import { ProductFooterActions } from "./tabs/ProductFooterActions";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => void;
  isPending: boolean;
  editingProduct: Product | null;
  sections?: Section[];
  activeSectionId: string | null;
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  editingProduct,
  sections,
  activeSectionId,
}: ProductModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "custom">("details");

  const methods = useForm<ProductFormValues>({
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
          primaryImage: editingProduct.primary_image_url || undefined,
          images: editingProduct.images
            ? editingProduct.images.map((img) => img.image_url)
            : editingProduct.primary_image_url
              ? [editingProduct.primary_image_url]
              : [],
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
          primaryImage: undefined,
          images: [],
          optionGroups: [],
        },
  });

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? "Edit Product" : "New Product"}
      description="Configure pricing, availability and customization options."
      footer={
        <ProductFooterActions
          onClose={onClose}
          isPending={isPending}
          isEditing={!!editingProduct}
          formId="product-form"
        />
      }
    >
      <FormProvider {...methods}>
        <form
          id="product-form"
          onSubmit={methods.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "details"
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Info className="w-4 h-4" /> Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "custom"
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Settings2 className="w-4 h-4" /> Customization
            </button>
          </div>

          {activeTab === "details" ? (
            <ProductDetailsTab sections={sections} />
          ) : (
            <ProductCustomizationTab />
          )}
        </form>
      </FormProvider>
    </SlideOver>
  );
}
