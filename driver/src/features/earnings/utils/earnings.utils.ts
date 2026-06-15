import { Earning, Period } from "../types/earnings.types";

export function filterByPeriod(earnings: Earning[], period: Period): Earning[] {
  if (period === "all") return earnings;
  const now = new Date();
  const cutoff = new Date(now);

  if (period === "today") {
    cutoff.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    cutoff.setDate(cutoff.getDate() - 7);
  } else {
    cutoff.setMonth(cutoff.getMonth() - 1);
  }

  return earnings.filter((e) => new Date(e.createdAt) >= cutoff);
}

export function sumEarnings(earnings: Earning[]) {
  return earnings.reduce((acc, e) => acc + Number(e.totalAmount), 0);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
