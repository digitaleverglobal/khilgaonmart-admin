import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { couponCodeService } from '../../services/marketingService';

export default function CouponCodeFormPage({ mode = 'create', coupon, onSave, onNavigate }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    code:      coupon?.code      ?? '',
    date:      coupon?.date      ?? '',
    type:      coupon?.type      ?? 'Percentage',
    amount:    coupon?.amount    ?? '',
    buyAmount: coupon?.buyAmount ?? '',
    status:    coupon?.status    ?? 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, amount: Number(form.amount), buyAmount: Number(form.buyAmount) };
      if (isEdit) { await couponCodeService.update(coupon.Id, payload); }
      else         { await couponCodeService.create(payload); }
      onSave && onSave();
      onNavigate('coupon_code');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Coupon Code {isEdit ? 'Edit' : 'Create'}</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
            <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate('coupon_code')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Manage</button>
        </div>
      </div>

      <div className="rounded bg-white p-6 shadow-sm">
        {error && <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <F label="Coupon Code *"><TextInput required value={form.code} onChange={(v) => set('code', v)} /></F>
          <F label="Offer Type *">
            <select value={form.type} onChange={(e) => set('type', e.target.value)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
              <option>Percentage</option><option>Fixed</option>
            </select>
          </F>
          <F label="Last Date *"><TextInput type="date" required value={form.date} onChange={(v) => set('date', v)} /></F>
          <F label="Amount *"><TextInput type="number" required value={form.amount} onChange={(v) => set('amount', v)} /></F>
          <F label="Minimum Buy Amount *"><TextInput type="number" required value={form.buyAmount} onChange={(v) => set('buyAmount', v)} /></F>
          <F label="Status">
            <button type="button" onClick={() => set('status', form.status === 'Active' ? 'Inactive' : 'Active')}
              className={`relative inline-flex h-8 w-[58px] items-center rounded-full transition-colors duration-200 focus:outline-none ${form.status === 'Active' ? 'bg-sky-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${form.status === 'Active' ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </F>
          <div className="lg:col-span-2">
            <button type="submit" disabled={saving} className="rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-500">{label}</span>{children}</label>;
}
function TextInput({ type = 'text', required = false, value, onChange }) {
  return <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />;
}
