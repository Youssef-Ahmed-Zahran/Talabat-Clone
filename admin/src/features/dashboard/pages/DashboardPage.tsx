import {
  ShoppingBag,
  Users,
  Truck,
  TrendingUp,
  Clock,
  DollarSign,
  Wallet,
} from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { useDashboard } from "../hooks/useDashboard";
import { StatCard } from "../components/StatCard";
import { timeAgo } from "../../../utils/date";

export default function DashboardPage() {
  const { query, state } = useDashboard();
  const { stats, isLoading, isError, refetch } = query;
  const { isAdmin } = state;

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          label={isAdmin ? "Total Revenue (GMV)" : "Store Revenue (GMV)"}
          value={`EGP ${Number(stats?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change=""
          icon={<DollarSign className="w-5 h-5" />}
          color="#FF5A00"
        />
        <StatCard
          label={isAdmin ? "App Profits (Net)" : "My Earnings (Net)"}
          value={`EGP ${Number(isAdmin ? stats?.totalAppProfit : stats?.storeEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={isAdmin ? "+12.5%" : ""}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#10B981"
          className="border-brand/20 bg-brand/[0.02]"
        />
        <StatCard
          label={isAdmin ? "Platform Wallet Balance" : "My Wallet Balance"}
          value={`EGP ${Number(isAdmin ? stats?.platformWallet?.balance : stats?.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change="Available"
          icon={<Wallet className="w-5 h-5" />}
          color="#4F46E5"
          className="border-indigo-100 bg-indigo-50/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Orders"
          value={stats?.orders?.total?.toLocaleString() || "0"}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="#FF5A00"
        />
        <StatCard
          label={isAdmin ? "Registered Users" : "Pending Orders"}
          value={
            isAdmin
              ? stats?.users?.toLocaleString() || "0"
              : stats?.orders?.pending?.toLocaleString() || "0"
          }
          icon={
            isAdmin ? (
              <Users className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )
          }
          color="#06B6D4"
        />
        <StatCard
          label={isAdmin ? "Active Drivers" : "Average Rating"}
          value={
            isAdmin
              ? stats?.drivers?.toLocaleString() || "0"
              : Number(stats?.reviews?.averageRating || 0).toFixed(1)
          }
          icon={
            isAdmin ? (
              <Truck className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )
          }
          color="#10B981"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">
                Revenue Overview
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Last 7 days performance
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              +18.2%
            </div>
          </div>

          {/* Simple bar chart visualization */}
          <div className="flex items-end justify-between gap-2 h-40 px-2">
            {(stats?.revenueHistory || []).map((item, i) => {
              const revenues =
                stats?.revenueHistory?.map((h) => h.revenue) || [];
              const maxRevenue = Math.max(...revenues, 100);
              const height = (item.revenue / maxRevenue) * 100;

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center h-full"
                >
                  <div className="flex-1 w-full flex items-end mb-2">
                    <div
                      className="w-full rounded-lg bg-brand/10 hover:bg-brand/20 transition-colors relative group"
                      style={{ height: `100%` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-lg bg-brand transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        EGP {item.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium shrink-0">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {stats?.activities?.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    item.type === "order"
                      ? "bg-[#FF5A00]/60"
                      : item.type === "store"
                        ? "bg-indigo-500/60"
                        : "bg-emerald-500/60"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-700 leading-snug">
                    {item.text}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span className="text-[11px] text-gray-400">
                      {timeAgo(item.time)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.activities || stats.activities.length === 0) && (
              <p className="text-sm text-gray-400 py-4 text-center">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stores Profits Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900">
            Stores Profits Breakdown
          </h2>
          <span className="text-xs text-gray-500">
            Based on Delivered Orders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">
                  Store
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">
                  Store Earnings
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 tracking-wider">
                  App Profit (Commission)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.storeEarningsBreakdown?.map(
                (store: {
                  storeId: string;
                  storeName: string;
                  logoUrl: string | null;
                  storeEarnings: number;
                  appProfitFromStore: number;
                }) => (
                  <tr
                    key={store.storeId}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                          {store.logoUrl ? (
                            <img
                              src={store.logoUrl}
                              alt={store.storeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className="text-[13px] font-semibold text-gray-900">
                          {store.storeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-gray-600">
                      EGP{" "}
                      {store.storeEarnings.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-semibold text-emerald-600">
                      EGP{" "}
                      {store.appProfitFromStore.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ),
              )}
              {(!stats?.storeEarningsBreakdown ||
                stats.storeEarningsBreakdown.length === 0) && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    No earnings data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
