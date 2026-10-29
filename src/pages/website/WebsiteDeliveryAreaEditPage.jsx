import { useState } from 'react';
import { deliveryAreaService } from '../../services/websiteService';
import { BD_DISTRICTS } from '../../utils/orderFilters';

export default function WebsiteDeliveryAreaEditPage({ area, onSave, onNavigate }) {
  const isEdit = Boolean(area?.Id);

  const [form, setForm] = useState({
    district:  area?.district  ?? '',
    area:      area?.area      ?? '',
    charge:    area?.charge    ?? '',
    sortOrder: area?.sortOrder ?? 0,
    status:    area?.status    ?? 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  const districtOptions = BD_DISTRICTS.includes(form.district) || !form.district
    ? BD_DISTRICTS
    : [form.district, ...BD_DISTRICTS];

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await deliveryAreaService.update(area.Id, form);
      } else {
        await deliveryAreaService.create(form);
      }
      onSave && onSave();
      onNavigate && onNavigate('delivery_area');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-bold text-gray-800">
          {isEdit ? 'Delivery Area Edit' : 'Delivery Area Create'}
        </h1>
        <div className="flex gap-2">
          <button type="button"
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('delivery_area')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
            Manage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District (জেলা) <span className="text-red-500">*</span>
              </label>
              <select value={form.district} onChange={(e) => set('district', e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400">
                <option value="">-- Select district --</option>
                {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area (এরিয়া) <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.area} onChange={(e) => set('area', e.target.value)} required
                placeholder="e.g. Khilgaon"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Charge (৳) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="0" step="0.01" value={form.charge} onChange={(e) => set('charge', e.target.value)} required
                placeholder="e.g. 60"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <button type="submit" disabled={saving}
              className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
