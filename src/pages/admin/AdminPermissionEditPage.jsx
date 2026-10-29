import { useState } from 'react';

export default function AdminPermissionEditPage({ permission, onSave, onNavigate }) {
  const [name, setName] = useState(permission?.name ?? '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave && onSave({ ...permission, name: name.trim() });
    onNavigate && onNavigate('admin_permissions');
  }

  const isEdit = !!permission?.id;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-800">
          {isEdit ? 'Permissions Edit' : 'Permissions Create'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('admin_permissions')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
