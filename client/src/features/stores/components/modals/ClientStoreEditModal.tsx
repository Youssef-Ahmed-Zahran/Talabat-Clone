import { Loader2, Check, X } from "lucide-react";
import { useClientStoreEditForm } from "../../hooks/useClientStoreEditForm";
import { ClientBrandingStep } from "../client-store-edit/ClientBrandingStep";
import { ClientGeneralInfoStep } from "../client-store-edit/ClientGeneralInfoStep";
import { ClientOperationsStep } from "../client-store-edit/ClientOperationsStep";
import type { Store } from "../../../../types";

interface ClientStoreEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
}

export function ClientStoreEditModal({
  isOpen,
  onClose,
  store,
}: ClientStoreEditModalProps) {
  const { form, state } = useClientStoreEditForm(store, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-white shadow-2xl flex flex-col animate-slide-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Store Settings</h2>
            <p className="text-sm text-gray-500">
              Update your store's information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="client-edit-store-form"
            onSubmit={form.handleSubmit(form.onSubmit)}
            className="space-y-8"
          >
            <ClientBrandingStep state={state} />
            <ClientGeneralInfoStep form={form} />
            <ClientOperationsStep form={form} store={store} />
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="client-edit-store-form"
            disabled={state.isPending}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
          >
            {state.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
