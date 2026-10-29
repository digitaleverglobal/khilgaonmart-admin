import { useState } from 'react';
import { supplierService } from '../../services/supplierService';

export default function SupplierFormPage({ mode = 'create', supplier, onSave, onNavigate }) {
  const [form, setForm] = useState({
    name:    supplier?.name    ?? '',
    phone:   supplier?.phone   ?? '',
    address: supplier?.address ?? '',
    note:    supplier?.note    ?? '',
    status:  supplier?.status  ?? 'Active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'edit' && supplier?.Id) {
        await supplierService.update(supplier.Id, form);
      } else {
        await supplierService.create(form);
      }
      onSave && onSave();
      onNavigate && onNavigate('supplier_list');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">
          {mode === 'edit' ? 'Supplier Edit' : 'Supplier Add'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('supplier_list')}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl shadow p-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Supplier name"
            />
          </div>

          {/* Phone + Address */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Supplier address"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-y"
              placeholder="Optional note"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Status</label>
            <button
              type="button"
              onClick={() => set('status', form.status === 'Active' ? 'Inactive' : 'Active')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                form.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  form.status === 'Active' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-3 text-xs text-gray-600">{form.status}</span>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2 rounded-lg transition"
            >
              {loading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
