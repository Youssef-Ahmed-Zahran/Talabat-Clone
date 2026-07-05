import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../config/axios";

import type { BulkImportResult } from "../../../types";

const bulkImportStores = async (file: File): Promise<BulkImportResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/stores/bulk-import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    // Long timeout for large files
    timeout: 10 * 60 * 1000,
  });

  return data.data ?? data;
};

export const useBulkImportStores = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkImportStores,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] });
    },
  });
};
