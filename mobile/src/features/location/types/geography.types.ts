// ============================================================
// Geography Types
// ============================================================

export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface Governorate {
  id: string;
  countryId: string;
  name: string;
}

export interface City {
  id: string;
  countryId: string;
  governorateId: string | null;
  name: string;
}
