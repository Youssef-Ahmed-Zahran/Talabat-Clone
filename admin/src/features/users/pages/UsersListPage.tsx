import { Search, Users as UsersIcon, ShieldOff, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useUsers, useBlockUser, useUnblockUser } from "../api/user.api";
import { useDebounce } from "../../../hooks/useDebouncing";
import type { User } from "../../../types";
import PageLoader from "../../../components/loader/PageLoader";
import ErrorFallback from "../../../components/error-boundary/ErrorFallback";
import { handleApiError } from "../../../utils/error";

export default function UsersListPage() {
  const { data: usersData, isLoading, isError, refetch } = useUsers();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const handleToggle = (userId: number | string, isActive: boolean) => {
    const idStr = userId.toString();
    if (isActive) {
      blockMutation.mutate(idStr, {
        onSuccess: () => toast.success("User blocked"),
        onError: (err) =>
          handleApiError(err, "We couldn't block this user. Please try again."),
      });
    } else {
      unblockMutation.mutate(idStr, {
        onSuccess: () => toast.success("User unblocked"),
        onError: (err) =>
          handleApiError(
            err,
            "We couldn't unblock this user. Please try again.",
          ),
      });
    }
  };

  const filtered = usersData?.users?.filter(
    (u: User) =>
      (u.fullName || "")
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorFallback onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Users
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage registered customers
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                User
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Email
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Phone
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Joined
              </th>
              <th className="text-right px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered && filtered.length > 0 ? (
              filtered.map((u: User) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/users/${u.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                        <UsersIcon className="w-4 h-4 text-gray-400 group-hover:text-brand transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-brand transition-colors">
                        {u.fullName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.phone || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${!u.isBlocked ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                    >
                      {!u.isBlocked ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggle(u.id, !u.isBlocked)}
                      disabled={
                        blockMutation.isPending || unblockMutation.isPending
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors ${!u.isBlocked ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"}`}
                    >
                      {!u.isBlocked ? (
                        <>
                          <ShieldOff className="w-3.5 h-3.5" /> Block
                        </>
                      ) : (
                        <>
                          <Shield className="w-3.5 h-3.5" /> Unblock
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-sm text-gray-400"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
