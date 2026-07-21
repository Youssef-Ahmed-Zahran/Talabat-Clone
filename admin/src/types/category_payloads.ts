export interface CreateCategoryPayload {
  name: string;
  image?: string;
  isActive?: boolean;
}

export interface CreateSubCategoryPayload {
  name: string;
  parentId: string;
  image?: string;
  isActive?: boolean;
}

export interface LinkStorePayload {
  subCategoryId: string;
  storeId: string;
}
