import { FileText, Eye, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { DriverDocument } from "../../../types/driver";

interface DriverDocumentsListProps {
  documents?: DriverDocument[];
  onVerify: (docId: string) => void;
  onReject: (docId: string) => void;
}

export function DriverDocumentsList({
  documents,
  onVerify,
  onReject,
}: DriverDocumentsListProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Required Documents
        </h3>
        <FileText className="w-4 h-4 text-gray-400" />
      </div>

      <div className="divide-y divide-gray-50">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {doc.documentType
                      .split("_")
                      .map(
                        (w: string) => w.charAt(0) + w.slice(1).toLowerCase(),
                      )
                      .join(" ")}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        doc.status === "VERIFIED"
                          ? "text-emerald-500"
                          : doc.status === "REJECTED"
                            ? "text-red-500"
                            : "text-amber-500"
                      }`}
                    >
                      {doc.status}
                    </span>
                    {doc.rejectionReason && (
                      <div className="flex items-center gap-1 text-[11px] text-red-400 italic">
                        • {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </a>
                {doc.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => onVerify(doc.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-100"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verify
                    </button>
                    <button
                      onClick={() => onReject(doc.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400 font-medium">
              No documents uploaded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
