import { useState } from 'react';
import { Edit2, ChevronLeft, ChevronRight, Plus, ToggleLeft, ToggleRight, Loader2, X } from 'lucide-react';
import { useAttributes } from '../../hooks/useProducts';
import { attributeService } from '../../services/productService';

const exportButtons = ['Copy', 'Print', 'PDF'];

export default function AttributePage({ onNavigate, onEditAttribute }) {
  const [search, setSearch] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const { data: attributes, meta, loading, error, refetch } = useAttributes({ searchTerm: search, limit: 100 });

  async function handleDelete(id) {
    if (!window.confirm('এই attribute মুছে ফেলবেন?')) return;
    try {
      await attributeService.delete(id);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleStatus(attr) {
    const active = attr.status === 'Active' || attr.status === 'active';
    const nextStatus = active ? 'Inactive' : 'Active';
    setStatusUpdatingId(attr.Id);
    try {
      await attributeService.update(attr.Id, {
        name: attr.name,
        status: nextStatus,
      });
      refetch();
    } catch (e) {
      alert(e.message || 'Attribute status update করতে সমস্যা হয়েছে');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold text-gray-800">Attribute Manage</h1>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            onClick={() => onNavigate && onNavigate('create_attribute')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition"
          >
            <Plus size={14} />
            Create
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            {exportButtons.map((label) => (
              <button
                key={label}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-4 py-2 border-r border-gray-200 last:border-r-0 first:rounded-l last:rounded-r transition"
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 md:justify-end">
            Search:
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 border border-gray-200 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>

        {loading && <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>}
        {error && <div className="text-center py-8 text-red-400 text-xs">{error}</div>}
        {!loading && !error && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="bg-gray-100 border-y border-gray-200">
                  <SortableHead className="w-24 text-left">SL</SortableHead>
                  <SortableHead className="text-left">Attribute Name</SortableHead>
                  <SortableHead className="text-left">Values</SortableHead>
                  <SortableHead className="text-left">Status</SortableHead>
                  <SortableHead className="text-left">Action</SortableHead>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr, index) => (
                  <tr
                    key={attr.Id}
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200 text-gray-600`}
                  >
                    <td className="px-4 py-4">{index + 1}</td>
                    <td className="px-4 py-4 font-semibold">{attr.name}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(attr.values) && attr.values.map((v, vi) => (
                          <span key={vi} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">{v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={attr.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <ActionButton title="Edit" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => onEditAttribute && onEditAttribute(attr)}>
                          <Edit2 size={13} />
                        </ActionButton>
                        <ActionButton title="Delete" className="bg-red-500 hover:bg-red-600" onClick={() => handleDelete(attr.Id)}>
                          <X size={14} />
                        </ActionButton>
                        <StatusToggleButton
                          active={attr.status === 'Active' || attr.status === 'active'}
                          loading={statusUpdatingId === attr.Id}
                          onClick={() => handleToggleStatus(attr)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {attributes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">No attributes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 px-0 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-gray-500">
            Showing {attributes.length ? 1 : 0} to {attributes.length} of {meta?.count ?? attributes.length} entries
          </p>
          <div className="flex items-center gap-2 sm:justify-end">
            <button className="flex h-8 w-8 items-center justify-center rounded text-gray-300 hover:bg-gray-100">
              <ChevronLeft size={14} />
            </button>
            <button className="h-8 w-8 rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">1</button>
            <button className="flex h-8 w-8 items-center justify-center rounded text-gray-300 hover:bg-gray-100">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active' || status === 'active';
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function SortableHead({ children, className = '' }) {
  return (
    <th className={`relative px-4 py-3 font-bold text-gray-500 ${className}`}>
      <span>{children}</span>
    </th>
  );
}

function ActionButton({ title, className, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-7 w-8 items-center justify-center rounded text-white transition ${className}`}
    >
      {children}
    </button>
  );
}

function StatusToggleButton({ active, loading, onClick }) {
  return (
    <button
      type="button"
      title={active ? 'Make Inactive' : 'Make Active'}
      onClick={onClick}
      disabled={loading}
      className={`flex h-7 w-8 items-center justify-center rounded text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
    </button>
  );
}
