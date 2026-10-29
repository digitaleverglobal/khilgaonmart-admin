import { useEffect, useState } from 'react';
import { orderStatusService } from '../../services/websiteService';
import { normalizeOrderStatuses, toOrderStatusKey } from '../../utils/orderStatuses';

export default function WebsiteOrderStatusEditPage({ status, onSave, onNavigate }) {
  const isEdit = Boolean(status?.Id);

  const [form, setForm] = useState({
    name:   status?.name   ?? '',
    status: status?.status ?? 'Active',
    showAfter: status?.showAfter ?? '',
  });
  const [statusOptions, setStatusOptions] = useState(() => normalizeOrderStatuses());
  const ownKey = toOrderStatusKey(form.name);

  useEffect(() => {
    orderStatusService
      .getAll({ limit: 100 })
      .then((res) => setStatusOptions(normalizeOrderStatuses(res.data || [])))
      .catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await orderStatusService.update(status.Id, form);
      } else {
        await orderStatusService.create(form);
      }
      onSave && onSave();
      onNavigate && onNavigate('order_status');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-gray-800">
          {isEdit ? 'Order Status Edit' : 'Order Status Create'}
        </h1>
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('order_status')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
            Manage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show After</label>
            <select value={form.showAfter} onChange={(e) => set('showAfter', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
              <option value="">শেষে দেখাবে (Default)</option>
              {statusOptions.filter((item) => item.key !== ownKey).map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Sidebar ও order tab এ এই status টি কোন status এর পরে দেখাবে।</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <button type="button" onClick={() => set('status', form.status === 'Active' ? 'Inactive' : 'Active')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${form.status === 'Active' ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${form.status === 'Active' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
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
