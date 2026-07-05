import type { Store, Category } from "./index";
import type { StoreFormValues } from "../schemas/store.schema";

export interface BulkImportError {
  row: number;
  reason: string;
}

export interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  errors: BulkImportError[];
}

export interface DropZoneProps {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

export interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ClientStoreEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
}

export interface StoreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStore: Store | null;
  categories?: Category[];
  onSubmit: (data: StoreFormValues, selectedZoneId: string) => void;
  isPending: boolean;
}
