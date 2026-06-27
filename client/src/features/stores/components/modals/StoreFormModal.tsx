import { FormProvider } from "react-hook-form";
import {
  Loader2,
  MapPin,
  Check,
  Building2,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { type StoreFormValues } from "../../../../schemas/store.schema";
import type { Category, Store } from "../../../../types";
import { SlideOver } from "../../../../components/layout/SlideOver";
import { useStoreForm } from "../../hooks/useStoreForm";
import { GeneralInfoStep } from "../steps/GeneralInfoStep";
import { BrandingStep } from "../steps/BrandingStep";
import { LocationStep } from "../steps/LocationStep";
import { OperationsStep } from "../steps/OperationsStep";
import { OwnerAccountStep } from "../steps/OwnerAccountStep";

interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStore: Store | null;
  categories?: Category[];
  onSubmit: (data: StoreFormValues, selectedZoneId: string) => void;
  isPending: boolean;
}

const steps = [
  { id: 1, name: "General Info", icon: Building2 },
  { id: 2, name: "Branding", icon: ImageIcon },
  { id: 3, name: "Location", icon: MapPin },
  { id: 4, name: "Operations", icon: Clock },
  { id: 5, name: "Owner Account", icon: ShieldCheck },
];

export function StoreFormModal({
  isOpen,
  onClose,
  editingStore,
  categories,
  onSubmit,
  isPending,
}: StoreFormModalProps) {
  const {
    methods,
    currentStep,
    zones,
    selectedZoneId,
    setSelectedZoneId,
    handleNext,
    handleBack,
  } = useStoreForm(isOpen, editingStore);

  const currentSteps = editingStore ? steps.filter((s) => s.id !== 5) : steps;
  const totalSteps = editingStore ? 4 : 5;

  const handleFormSubmit = (data: StoreFormValues) => {
    onSubmit(data, selectedZoneId);
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={editingStore ? "Edit Store" : "Create Store"}
      description="Manage vendor registration and operational details."
      footer={
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 px-4"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={methods.handleSubmit(handleFormSubmit)}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/10 disabled:opacity-70"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingStore ? "Save Changes" : "Create Store"}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Progress Tracker */}
        <div className="flex items-center justify-between px-2">
          {currentSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300
                ${
                  currentStep === step.id
                    ? "bg-brand text-white ring-4 ring-brand/10"
                    : currentStep > step.id
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-400"
                }
              `}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              {idx < currentSteps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? "bg-emerald-500" : "bg-gray-100"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <FormProvider {...methods}>
          <form
            className="animate-fade-in"
            onSubmit={(e) => e.preventDefault()}
          >
            {currentStep === 1 && <GeneralInfoStep categories={categories} />}
            {currentStep === 2 && <BrandingStep />}
            {currentStep === 3 && (
              <LocationStep
                zones={zones}
                selectedZoneId={selectedZoneId}
                setSelectedZoneId={setSelectedZoneId}
              />
            )}
            {currentStep === 4 && <OperationsStep />}
            {currentStep === 5 && (
              <OwnerAccountStep isEditing={!!editingStore} />
            )}
          </form>
        </FormProvider>
      </div>
    </SlideOver>
  );
}
