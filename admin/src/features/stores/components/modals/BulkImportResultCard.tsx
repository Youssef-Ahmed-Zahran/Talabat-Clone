import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { BulkImportResult } from "../../../../types";

export function ResultCard({ result }: { result: BulkImportResult }) {
  const [showErrors, setShowErrors] = useState(false);
  const allGood = result.failed === 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-800">{result.total}</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
            Total rows
          </p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">
            {result.created}
          </p>
          <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">
            Created
          </p>
        </div>
        <div
          className={`rounded-2xl p-4 text-center ${result.failed > 0 ? "bg-red-50" : "bg-gray-50"}`}
        >
          <p
            className={`text-2xl font-black ${result.failed > 0 ? "text-red-500" : "text-gray-400"}`}
          >
            {result.failed}
          </p>
          <p
            className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${result.failed > 0 ? "text-red-400" : "text-gray-400"}`}
          >
            Failed
          </p>
        </div>
      </div>

      {/* Success / partial banner */}
      {allGood ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-bold text-emerald-700">
            All stores created successfully! 🎉
          </p>
        </div>
      ) : result.created > 0 ? (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-700">
            {result.created} stores created · {result.failed} rows failed
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">
            No stores were created. See errors below.
          </p>
        </div>
      )}

      {/* Error list collapsible */}
      {result.errors.length > 0 && (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowErrors((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-[13px] font-bold text-gray-700">
              {result.errors.length} error
              {result.errors.length !== 1 ? "s" : ""} — click to view
            </span>
            {showErrors ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showErrors && (
            <div className="max-h-52 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-16">
                      Row
                    </th>
                    <th className="text-left px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">
                        {err.row}
                      </td>
                      <td className="px-4 py-2 text-xs text-red-600 font-medium">
                        {err.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
