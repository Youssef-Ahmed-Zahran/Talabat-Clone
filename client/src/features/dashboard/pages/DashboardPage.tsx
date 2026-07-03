import {
  ShoppingBag,
  TrendingUp,
  Clock,
  DollarSign,
  Wallet,
  Star,
  PackageCheck,
  XCircle,
  BarChart2,
} from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { useDashboard } from "../hooks/useDashboard";
import { StatCard } from "../components/StatCard";

export default function DashboardPage() {
  const { query } = useDashboard();
  const { stats, isLoading, isError, refetch } = query;

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  const totalOrders = stats?.orders?.total ?? 0;
  const deliveredOrders = stats?.orders?.delivered ?? 0;
  const completionRate =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Store Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's your store performance at a glance.
          </p>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          label="Store Revenue (GMV)"
          value={`EGP ${Number(stats?.revenue ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="#FF5A00"
        />
        <StatCard
          label="My Earnings (Net)"
          value={`EGP ${Number(stats?.storeEarnings ?? 0).toLocaleString(
            undefined,
            { minimumFractionDigits: 2, maximumFractionDigits: 2 },
          )}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#10B981"
          className="border-emerald-100 bg-emerald-50/20"
        />
        <StatCard
          label="My Wallet Balance"
          value={`EGP ${Number(stats?.wallet?.balance ?? 0).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}`}
          change="Available"
          icon={<Wallet className="w-5 h-5" />}
          color="#4F46E5"
          className="border-indigo-100 bg-indigo-50/30"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={stats?.orders?.total?.toLocaleString() ?? "0"}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="#FF5A00"
        />
        <StatCard
          label="Pending Orders"
          value={stats?.orders?.pending?.toLocaleString() ?? "0"}
          icon={<Clock className="w-5 h-5" />}
          color="#F59E0B"
        />
        <StatCard
          label="Delivered Orders"
          value={stats?.orders?.delivered?.toLocaleString() ?? "0"}
          icon={<PackageCheck className="w-5 h-5" />}
          color="#10B981"
        />
        <StatCard
          label="Average Rating"
          value={Number(stats?.reviews?.averageRating ?? 0).toFixed(1)}
          icon={<Star className="w-5 h-5" />}
          color="#F59E0B"
        />
      </div>

      {/* Content Grid: Revenue Chart + Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
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
            <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
              <BarChart2 className="w-3.5 h-3.5" />
              7-day trend
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-40 px-2">
            {(stats?.revenueHistory ?? []).map((item, i) => {
              const revenues =
                stats?.revenueHistory?.map((h) => h.revenue) ?? [];
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
                      style={{ height: "100%" }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-lg bg-brand transition-all duration-500"
                        style={{ height: `${height}%` }}
                      />
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
            {(!stats?.revenueHistory || stats.revenueHistory.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                No revenue data yet
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>

          <div className="space-y-3 flex-1">
            {/* Completion Rate */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Completion Rate</span>
                <span className="font-semibold text-gray-700">
                  {completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF5A00]/60" />
                  <span className="text-xs text-gray-600">Total Orders</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  {stats?.orders?.total?.toLocaleString() ?? "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-gray-600">Pending</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  {stats?.orders?.pending?.toLocaleString() ?? "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-600">Delivered</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  {stats?.orders?.delivered?.toLocaleString() ?? "0"}
                </span>
              </div>
              {stats?.orders?.cancelled !== undefined && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-gray-600">Cancelled</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">
                    {stats.orders.cancelled.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Avg Rating pill */}
          <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <div>
              <p className="text-xs text-amber-700 font-semibold">
                {Number(stats?.reviews?.averageRating ?? 0).toFixed(1)} / 5.0
              </p>
              <p className="text-[10px] text-amber-500">
                {stats?.reviews?.totalReviews?.toLocaleString() ?? "0"} reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Paid Info */}
      {stats?.appCommissionPaid !== undefined && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">
                  App Commission Paid
                </p>
                <p className="text-xs text-gray-400">
                  Deducted from your gross revenue
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-red-500">
              EGP{" "}
              {Number(stats.appCommissionPaid).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
