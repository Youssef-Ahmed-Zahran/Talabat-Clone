export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ListResponse<T, Key extends string> = {
  [K in Key]: T[];
};

export type PaginatedListResponse<T, Key extends string> = ListResponse<T, Key> & {
  pagination: PaginationMeta;
};
