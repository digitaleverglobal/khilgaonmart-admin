import { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { useRolePermissions } from '../../hooks/useAdmin';
import { rolePermissionService } from '../../services/adminService';

export default function AdminRolesPage({ onEditRole }) {
  const { data: roles, loading, error, refetch } = useRolePermissions();
  const [roleName, setRoleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    const role = roleName.trim();
    if (!role) return;
    setSaving(true);
    setFormError('');
    try {
      await rolePermissionService.create({ role, menuPermissions: [] });
      setRoleName('');
      refetch();
    } catch (err) {
      setFormError(err.message || 'Role create failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(roleRow) {
    if (!window.confirm(`"${roleRow.role}" role delete করবেন? এই role assigned থাকলে users গুলো "user" role-এ move হবে।`)) return;
    try {
      await rolePermissionService.delete(roleRow.role);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Roles Manage</h1>
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 shadow">
        <div className="min-w-[260px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-gray-600">Create Dynamic Role</label>
          <input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g. salesManager"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          {formError && <p className="mt-1 text-[11px] font-semibold text-red-500">{formError}</p>}
        </div>
        <button
          type="submit"
          disabled={saving || !roleName.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
        >
          <Plus size={14} />
          {saving ? 'Creating...' : 'Add Role'}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['SL', 'Role', 'Permissions Count', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {!loading && error && <tr><td colSpan={4} className="text-center py-10 text-red-400">{error}</td></tr>}
              {!loading && !error && roles.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No roles found</td></tr>
              )}
              {!loading && roles.map((role, i) => (
                <tr key={role.Id ?? role.role} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 capitalize">{role.role}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                      {(role.menuPermissions || []).length} permissions
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button type="button" title="Edit" onClick={() => onEditRole && onEditRole(role)}
                        className="w-7 h-7 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition">
                        <Pencil size={13} />
                      </button>
                      <button type="button" title="Delete Role" onClick={() => handleDelete(role)}
                        className="w-7 h-7 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition">
                        <X size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {roles.length} role{roles.length !== 1 ? 's' : ''} total
          </span>
        </div>
      </div>
    </div>
  );
}
