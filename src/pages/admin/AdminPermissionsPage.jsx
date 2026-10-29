import { Pencil } from 'lucide-react';
import { useRolePermissions } from '../../hooks/useAdmin';

export default function AdminPermissionsPage({ onEditPermission }) {
  const { data: roles, loading, error } = useRolePermissions();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Permissions Manage</h1>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['SL', 'Role', 'Permissions', 'Count', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {!loading && error && <tr><td colSpan={5} className="text-center py-10 text-red-400">{error}</td></tr>}
              {!loading && !error && roles.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No data available</td></tr>
              )}
              {!loading && roles.map((role, i) => {
                const perms = role.menuPermissions || [];
                return (
                  <tr key={role.Id ?? role.role} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 capitalize">{role.role}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {perms.slice(0, 5).map((p) => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 font-medium">{p}</span>
                        ))}
                        {perms.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">+{perms.length - 5} more</span>
                        )}
                        {perms.length === 0 && <span className="text-gray-400">No permissions</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                        {perms.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        title="Edit Permissions"
                        onClick={() => onEditPermission && onEditPermission(role)}
                        className="w-7 h-7 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{roles.length} role{roles.length !== 1 ? 's' : ''} total</span>
        </div>
      </div>
    </div>
  );
}
