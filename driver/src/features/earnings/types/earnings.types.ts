export interface Earning {
  id: string;
  orderId: string;
  baseAmount: string;
  tipAmount: string;
  totalAmount: string;
  paidOut: boolean;
  paidOutAt: string | null;
  createdAt: string;
}

export type Period = "today" | "week" | "month" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};
