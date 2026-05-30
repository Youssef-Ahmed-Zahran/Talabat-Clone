import React from "react";
import { MapPin, Save, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { useZoneEditor } from "../hooks/useZoneEditor";
import { ZoneConfigForm } from "../components/ZoneConfigForm";
import { ZoneAssignmentView } from "../components/ZoneAssignmentView";

const ZoneEditorPage: React.FC = () => {
  const { state, actions, router } = useZoneEditor();
  const { form, geocoding, stores, drivers, ui } = state;
  const { navigate } = router;

  return (
    <div className="min-h-screen bg-[#F9FAFB] animate-fade-in pb-12">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-100/50 px-4 lg:px-12 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/zones")}
            className="group p-3 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-2xl transition-all duration-300"
          >
            <ArrowLeft
              size={22}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand premium-shadow ring-4 ring-brand/5">
              <MapPin size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                {form.mode === "create" ? "Create Zone" : "Edit Zone"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.1em]">
                  {form.mode === "create"
                    ? "Delivery Area Definition"
                    : `ID: ${form.id?.slice(0, 8)}…`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          className="group inline-flex items-center gap-3 px-8 py-3.5 bg-brand text-white font-black rounded-2xl hover:bg-brand-dark transition-all duration-300 premium-shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          onClick={actions.handleSave}
          disabled={ui.saving}
        >
          {ui.saving ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save
              size={20}
              className="group-hover:rotate-12 transition-transform"
            />
          )}
          <span>{ui.saving ? "Saving Changes…" : "Save Zone"}</span>
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-12 animate-slide-up">
        {ui.saveError && (
          <div className="mb-8 flex items-center gap-4 p-5 bg-red-50 border border-red-100/50 rounded-[24px] text-red-600 shadow-sm animate-shake">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-sm font-bold">{ui.saveError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Form */}
          <div className="lg:col-span-4 space-y-8">
            <ZoneConfigForm
              form={form}
              geocoding={geocoding}
              actions={actions}
              ui={ui}
            />
          </div>

          {/* Right: Map + Stores tabs */}
          <ZoneAssignmentView
            form={form}
            ui={ui}
            stores={stores}
            drivers={drivers}
            actions={actions}
          />
        </div>
      </div>
    </div>
  );
};

export default ZoneEditorPage;
