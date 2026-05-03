export interface CreateCategoryPayload {
  name: string;
  image?: string;
}

export interface CreateSubCategoryPayload {
  name: string;
  parentId: string;
  image?: string;
}

export interface LinkStorePayload {
  subCategoryId: string;
  storeId: string;
}
