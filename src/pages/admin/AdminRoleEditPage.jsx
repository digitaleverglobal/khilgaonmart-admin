import { useEffect, useMemo, useState } from 'react';
import { rolePermissionService } from '../../services/adminService';

const FALLBACK_PERMISSIONS = [
  'dashboard',
  'orders',
  'products',
  'supplier',
  'purchase',
  'landing_page',
  'admin_user',
  'admin_roles',
  'admin_permissions',
  'customers',
  'ip_block',
  'website_setting',
  'api_integration',
  'marketing_tools',
  'blogs',
  'banner_ads',
  'expense',
  'reports',
  'cache_clear',
];

export default function AdminRoleEditPage({ role, onSave, onNavigate }) {
  const [checked, setChecked] = useState(new Set(role?.menuPermissions ?? []));
  const [availablePermissions, setAvailablePermissions] = useState(FALLBACK_PERMISSIONS);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadPermissions() {
      setLoadingPermissions(true);
      try {
        const res = await rolePermissionService.getAvailable();
        const permissions = Array.isArray(res?.data) ? res.data : [];
        if (alive && permissions.length) {
          setAvailablePermissions(permissions);
        }
      } catch (err) {
        if (alive) {
          setError(err.message || 'Permission list load failed');
        }
      } finally {
        if (alive) setLoadingPermissions(false);
      }
    }

    loadPermissions();
    return () => {
      alive = false;
    };
  }, []);

  const availableSet = useMemo(() => new Set(availablePermissions), [availablePermissions]);
  const selectedAvailableCount = availablePermissions.filter((perm) => checked.has(perm)).length;
  const allChecked = availablePermissions.length > 0 && selectedAvailableCount === availablePermissions.length;
  const someChecked = selectedAvailableCount > 0 && !allChecked;

  function toggleAll() {
    setChecked((prev) => {
      if (!allChecked) return new Set(availablePermissions);
      const next = new Set(prev);
      availablePermissions.forEach((perm) => next.delete(perm));
      return next;
    });
  }

  function toggle(perm) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!role?.role) return;
    setSaving(true);
    setError('');
    try {
      const menuPermissions = [...checked].filter((perm) => availableSet.has(perm));
      await rolePermissionService.update(role.role, menuPermissions);
      onSave && onSave();
      onNavigate && onNavigate('admin_roles');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  const cols = [[], [], []];
  availablePermissions.forEach((p, i) => cols[i % 3].push(p));

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">
          Role Permissions — <span className="text-indigo-600 capitalize">{role?.role}</span>
        </h1>
        <button type="button" onClick={() => onNavigate && onNavigate('admin_roles')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
          Manage
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked; }}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-blue-600"
          />
          <span className="text-sm font-semibold text-blue-600">
            Check All ({selectedAvailableCount} / {availablePermissions.length})
          </span>
        </label>

        <div className="bg-white rounded-xl shadow p-4">
          {loadingPermissions && (
            <div className="pb-4 text-xs font-semibold text-gray-400">Loading permissions...</div>
          )}
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-3">
            {cols.map((col, ci) => (
              <div key={ci} className="space-y-0">
                {col.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 px-1 rounded select-none">
                    <input
                      type="checkbox"
                      checked={checked.has(perm)}
                      onChange={() => toggle(perm)}
                      className="w-3.5 h-3.5 rounded accent-blue-600 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-700">{perm}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </form>
    </div>
  );
}
