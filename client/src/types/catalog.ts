// ── Catalog Types ──────────────────────────────────────────────────────

export interface Section {
  id: string;
  store_id: string;
  name: string;
  sort_order: number;
  products_count?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  store_id: string;
  section_id: string | null;
  name: string;
  description: string | null;
  price: number;
  quantity: number | null;
  primary_image_url: string | null;
  is_available: boolean;
  meta: Record<string, unknown>;
  images?: ProductImage[] | null;
  section?: Section | null;
  option_groups?: OptionGroup[] | null;
  created_at: string;
  updated_at?: string;
}

export interface OptionValue {
  id: string;
  option_group_id: string;
  name: string;
  extra_price: number;
}

export interface OptionGroup {
  id: string;
  product_id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  parent_option_value_id: string | null;
  values: OptionValue[] | null;
}

// ── Payloads ──────────────────────────────────────────────────────────

export interface CreateSectionPayload {
  name: string;
  sortOrder?: number;
}

export interface UpdateSectionPayload {
  name?: string;
  sortOrder?: number;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  sectionId?: string;
  secondarySectionIds?: string[];
  primaryImage?: string;
  images?: string[];
  meta?: Record<string, unknown>;
  optionGroups?: {
    name: string;
    isRequired?: boolean;
    minSelect?: number;
    maxSelect?: number;
    sortOrder?: number;
    values?: { name: string; extraPrice?: number }[];
  }[];
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  sectionId?: string;
  secondarySectionIds?: string[];
  isAvailable?: boolean;
  primaryImage?: string;
  meta?: Record<string, unknown>;
  optionGroups?: {
    name: string;
    isRequired?: boolean;
    minSelect?: number;
    maxSelect?: number;
    sortOrder?: number;
    values?: { name: string; extraPrice?: number }[];
  }[];
}

export interface CreateOptionGroupPayload {
  name: string;
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
  parentOptionValueId?: string;
  values?: { name: string; extraPrice?: number }[];
}

export interface UpdateOptionGroupPayload {
  name?: string;
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
}

export interface CreateOptionValuePayload {
  name: string;
  extraPrice?: number;
}

export interface UpdateOptionValuePayload {
  name?: string;
  extraPrice?: number;
}
