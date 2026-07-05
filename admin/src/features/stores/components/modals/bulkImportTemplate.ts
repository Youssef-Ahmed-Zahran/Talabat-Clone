import * as XLSX from "xlsx";

export const TEMPLATE_COLUMNS = [
  "name",
  "ownerEmail",
  "ownerPassword",
  "mainCategoryId",
  "storeType",
  "deliveryType",
  "cityName",
  "countryName",
  "countryCode",
  "latitude",
  "longitude",
  "phone",
  "email",
  "address",
  "deliveryFees",
  "minimumOrderCost",
  "deliveryTimeMinutes",
  "openTime",
  "closeTime",
  "commissionRate",
];

export const SAMPLE_ROWS = [
  {
    name: "My Burger Place",
    ownerEmail: "owner@example.com",
    ownerPassword: "SecurePass123",
    mainCategoryId: "Restaurants", // You can use Name or ID
    storeType: "RESTAURANT",
    deliveryType: "TALABAT_DELIVERY",
    cityName: "Cairo",
    countryName: "Egypt",
    countryCode: "EG",
    latitude: "30.0444",
    longitude: "31.2357",
    phone: "+201234567890",
    email: "store@example.com",
    address: "123 Tahrir Square",
    deliveryFees: "10",
    minimumOrderCost: "50",
    deliveryTimeMinutes: "30",
    openTime: "09:00",
    closeTime: "23:00",
    commissionRate: "15",
  },
];

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const wsData = [TEMPLATE_COLUMNS, ...SAMPLE_ROWS.map((r) => TEMPLATE_COLUMNS.map((c) => (r as Record<string, string>)[c] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-width columns
  const colWidths = TEMPLATE_COLUMNS.map((col) => ({ wch: Math.max(col.length + 4, 18) }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Stores");
  XLSX.writeFile(wb, "talabat_stores_template.xlsx");
}
