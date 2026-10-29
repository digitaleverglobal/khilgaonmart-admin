import { useState } from "react";
import { userService } from "../../services/adminService";
import { useRolePermissions } from "../../hooks/useAdmin";

export default function AdminUserEditPage({ user, onSave, onNavigate }) {
  const isEdit = Boolean(user?.Id);
  const {
    data: roles,
    loading: rolesLoading,
    error: rolesError,
  } = useRolePermissions();
  const [form, setForm] = useState({
    FirstName: user?.FirstName ?? "",
    LastName: user?.LastName ?? "",
    Email: user?.Email ?? "",
    Phone: user?.Phone ?? user?.phone ?? "",
    Password: "",
    confirmPassword: "",
    role: user?.role ?? "user",
    status:
      String(user?.status || "Active").toLowerCase() === "active"
        ? "Active"
        : "Inactive",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(f, v) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.Password && form.Password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        FirstName: form.FirstName,
        LastName: form.LastName,
        Email: form.Email,
        Phone: form.Phone,
        role: form.role,
        status: form.status,
      };
      if (form.Password) payload.Password = form.Password;

      if (isEdit) {
        await userService.update(user.Id, payload);
      } else {
        await userService.register({ ...payload, Password: form.Password });
      }
      onSave && onSave();
      onNavigate && onNavigate("admin_user");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">
          {isEdit ? "Edit User" : "Create User"}
        </h1>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate("admin_user")}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
        >
          Manage
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.FirstName}
                onChange={(e) => set("FirstName", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={form.LastName}
                onChange={(e) => set("LastName", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.Email}
              onChange={(e) => set("Email", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.Phone}
              onChange={(e) => set("Phone", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              placeholder="017XXXXXXXX"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={form.Password}
                onChange={(e) => set("Password", e.target.value)}
                required={!isEdit}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                required={!isEdit && Boolean(form.Password)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                disabled={rolesLoading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              >
                {rolesLoading && (
                  <option value={form.role}>Loading roles...</option>
                )}
                {!rolesLoading && roles.length === 0 && (
                  <option value="">No roles found</option>
                )}
                {!rolesLoading &&
                  roles.map((role) => (
                    <option key={role.Id ?? role.role} value={role.role}>
                      {role.role}
                    </option>
                  ))}
              </select>
              {rolesError && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">
                  {rolesError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
