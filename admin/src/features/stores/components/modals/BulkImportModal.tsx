import { X, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { downloadTemplate } from "./bulkImportTemplate";
import { DropZone } from "./BulkImportDropZone";
import { ResultCard } from "./BulkImportResultCard";
import { useBulkImportModal } from "../../hooks/useBulkImportModal";

import type { BulkImportModalProps } from "../../../../types";

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const { state, actions } = useBulkImportModal({ onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={actions.handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-lg shadow-brand/20">
              <FileSpreadsheet className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-gray-900">
                Bulk Import Stores
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">
                Upload an Excel file to create stores in batch
              </p>
            </div>
          </div>
          <button
            onClick={actions.handleClose}
            disabled={state.isLoading}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!state.result && (
            <div className="flex items-center justify-between p-4 bg-brand/5 border border-brand/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-800">
                    Need a template?
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Download our sample Excel file
                  </p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 text-[12px] font-bold text-brand bg-white hover:bg-gray-50 border border-brand/10 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Download
              </button>
            </div>
          )}

          {/* Drop zone or file selected */}
          {!state.result ? (
            <>
              <DropZone
                file={state.file}
                onFile={actions.setFile}
                onClear={actions.handleClearFile}
                disabled={state.isLoading}
              />

              {/* Loading state */}
              {state.isLoading && (
                <div className="flex items-center gap-3 p-4 bg-brand/5 border border-brand/15 rounded-2xl">
                  <Loader2 className="w-5 h-5 text-brand animate-spin shrink-0" />
                  <div>
                    <p className="text-[13px] font-bold text-brand">
                      Processing stores…
                    </p>
                    <p className="text-[11px] text-brand/60">
                      This may take a few minutes for large files
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Result view */
            <ResultCard result={state.result} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {state.result ? (
            <>
              <button
                onClick={actions.handleClearFile}
                className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
              >
                Import Another File
              </button>
              <button
                onClick={actions.handleClose}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand to-brand-light rounded-2xl hover:shadow-lg hover:shadow-brand/20 transition-all"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={actions.handleClose}
                disabled={state.isLoading}
                className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={actions.handleImport}
                disabled={!state.file || state.isLoading}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand to-brand-light rounded-2xl hover:shadow-lg hover:shadow-brand/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
              >
                {state.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing…
                  </span>
                ) : (
                  "Import Stores"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
