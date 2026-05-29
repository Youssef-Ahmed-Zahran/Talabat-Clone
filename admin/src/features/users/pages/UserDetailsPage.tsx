import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldOff,
  ShoppingBag,
} from "lucide-react";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import type { Order } from "../../../types";
import { useUserDetails } from "../hooks/useUserDetails";

export default function UserDetailsPage() {
  const { query, actions, router } = useUserDetails();

  if (query.isUserLoading) return <PageLoader />;
  if (query.isUserError || !query.user)
    return <ErrorFallback onRetry={query.refetchUser} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.navigate("/users")}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              User Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage user profile
            </p>
          </div>
        </div>

        <button
          onClick={actions.handleToggleBlock}
          disabled={actions.isPendingToggle}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            !query.user.isBlocked
              ? "text-red-600 bg-red-50 hover:bg-red-100"
              : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
          }`}
        >
          {!query.user.isBlocked ? (
            <>
              <ShieldOff className="w-4 h-4" /> Block User
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" /> Unblock User
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                <UserIcon className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {query.user.fullName}
              </h2>
              <span
                className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  !query.user.isBlocked
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {!query.user.isBlocked ? "Active" : "Blocked"}
              </span>
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium">
                    Email
                  </span>
                  <span className="text-gray-900">{query.user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium">
                    Phone
                  </span>
                  <span className="text-gray-900">
                    {query.user.phone || "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium">
                    Joined
                  </span>
                  <span className="text-gray-900">
                    {new Date(query.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-400" />
                Order History
              </h3>
              <span className="text-sm text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
                {query.orders?.orders?.length || 0} Orders
              </span>
            </div>

            {query.isOrdersLoading ? (
              <div className="p-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : query.isOrdersError ? (
              <div className="p-12 text-center text-sm text-red-500">
                Failed to load orders
                <button
                  onClick={() => query.refetchOrders()}
                  className="ml-2 text-brand hover:underline font-medium"
                >
                  Retry
                </button>
              </div>
            ) : query.orders?.orders && query.orders.orders.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Order ID
                    </th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {query.orders.orders.map((order: Order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.navigate(`/orders?search=${order.id}`)
                      }
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-sm text-gray-500">
                No orders found for this user.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
