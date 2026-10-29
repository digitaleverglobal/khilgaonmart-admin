import { useState } from "react";
import {
  Pencil,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUsers } from "../../hooks/useAdmin";
import { userService } from "../../services/adminService";

const PAGE_SIZES = [10, 20, 50];

export default function AdminUserPage({ onNavigate, onEditUser }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const {
    data: users,
    meta,
    loading,
    error,
    refetch,
  } = useUsers({
    searchTerm: searchTerm || undefined,
    page,
    limit: perPage,
  });

  const total = meta?.count ?? users.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function handleSearch(e) {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  }

  async function handleDelete(id) {
    if (!window.confirm("এই user মুছে ফেলবেন?")) return;
    try {
      await userService.delete(id);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDistributionToggle(user) {
    try {
      await userService.updateOrderDistribution(user.Id, !user.orderDistribution);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStatusToggle(user) {
    const isActive = String(user.status || "").toLowerCase() === "active";
    const newStatus = isActive ? "Inactive" : "Active";
    try {
      await userService.updateStatus(user.Id, newStatus);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Users Manage</h1>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate("admin_user_edit")}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
        >
          Create
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Show</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Search:</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 w-44"
            />
            <button
              type="submit"
              className="text-xs bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
            >
              Go
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  "SL",
                  "Name",
                  "Email",
                  "Phone",
                  "Role",
                  "Order Distribution",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-gray-500 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-red-400">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No data available in table
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((user, i) => {
                  const fullName =
                    [user.FirstName, user.LastName].filter(Boolean).join(" ") ||
                    user.Email;
                  const isActive =
                    String(user.status || "").toLowerCase() === "active";
                  return (
                    <tr
                      key={user.Id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {(page - 1) * perPage + i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {fullName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.Email}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {user.Phone || user.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {String(user.role || "").toLowerCase() === "user" ? (
                          <span className="text-gray-400">n/a</span>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(user.orderDistribution)}
                            title={user.orderDistribution ? "নতুন order auto assign হবে" : "Auto order distribution বন্ধ"}
                            onClick={() => handleDistributionToggle(user)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${user.orderDistribution ? "bg-teal-500" : "bg-gray-300"}`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${user.orderDistribution ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(user)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                            isActive
                              ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                              : "bg-red-100 text-red-600 hover:bg-red-200"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <ActionBtn
                            icon={<ShieldCheck size={13} />}
                            title="Assign Role"
                            color="bg-gray-500 hover:bg-gray-600"
                            onClick={() =>
                              onNavigate && onNavigate("admin_roles")
                            }
                          />
                          <ActionBtn
                            icon={<Pencil size={13} />}
                            title="Edit"
                            color="bg-blue-500 hover:bg-blue-600"
                            onClick={() => onEditUser && onEditUser(user)}
                          />
                          <ActionBtn
                            icon={<X size={13} />}
                            title="Delete"
                            color="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDelete(user.Id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to{" "}
            {Math.min(page * perPage, total)} of {total} entries
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-7 h-7 rounded border border-gray-300 text-gray-400 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft size={12} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center ${pg === page ? "bg-indigo-500 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-7 h-7 rounded border border-gray-300 text-gray-400 hover:bg-gray-50 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, color, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-7 h-7 rounded text-white flex items-center justify-center transition ${color}`}
    >
      {icon}
    </button>
  );
}
