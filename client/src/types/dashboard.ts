export interface DashboardStats {
  // Admin & Owner Shared
  revenue: number;
  orders: {
    total: number;
    pending: number;
    delivered: number;
    cancelled?: number;
  };
  
  // Admin Only
  users?: number;
  drivers?: number;
  stores?: number;
  totalAppProfit?: number;
  platformWallet?: {
    balance: number;
  };
  activities?: Array<{
    id: string;
    text: string;
    time: string;
    type: 'order' | 'driver' | 'store';
  }>;
  revenueHistory?: Array<{
    day: string;
    revenue: number;
  }>;
  storeEarningsBreakdown?: Array<{
    storeId: string;
    storeName: string;
    logoUrl: string | null;
    storeEarnings: number;
    appProfitFromStore: number;
  }>;

  // Owner Only
  wallet?: {
    balance: number;
  };
  storeEarnings?: number;
  appCommissionPaid?: number;
  reviews?: {
    averageRating: number;
    totalReviews: number;
  };
}
