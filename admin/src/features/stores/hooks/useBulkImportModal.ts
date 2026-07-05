import { useState } from "react";
import {
  useBulkImportStores,
  type BulkImportResult,
} from "../api/bulkImport.api";
import { handleApiError } from "../../../utils/error";

export interface UseBulkImportModalProps {
  onClose: () => void;
}

export function useBulkImportModal({ onClose }: UseBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const importMutation = useBulkImportStores();
  const isLoading = importMutation.isPending;

  const handleClose = () => {
    if (isLoading) return;
    setFile(null);
    setResult(null);
    importMutation.reset();
    onClose();
  };

  const handleClearFile = () => {
    setFile(null);
    setResult(null);
    importMutation.reset();
  };

  const handleImport = () => {
    if (!file) return;
    setResult(null);
    importMutation.mutate(file, {
      onSuccess: (data) => {
        setResult(data);
      },
      onError: (err) =>
        handleApiError(err, "Import failed. Please check your file."),
    });
  };

  return {
    state: {
      file,
      result,
      isLoading,
    },
    actions: {
      setFile,
      handleClose,
      handleClearFile,
      handleImport,
    },
  };
}
