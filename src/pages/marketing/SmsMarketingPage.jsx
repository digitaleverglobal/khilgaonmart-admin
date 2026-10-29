import { useState } from 'react';
import { CheckCircle, PlayCircle } from 'lucide-react';
import { smsMarketingService } from '../../services/marketingService';

const FILTERS = ['All', 'Active Customers', 'Inactive Customers'];

export default function SmsMarketingPage() {
  const [form, setForm]       = useState({ customers: 'All', smsText: '' });
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true); setError(''); setResult(null);
    try {
      const res = await smsMarketingService.send(form);
      setResult(res.data);
      setForm((p) => ({ ...p, smsText: '' }));
    } catch (err) {
      setError(err.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">SMS Marketing</h1>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
          <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="mx-auto max-w-5xl rounded bg-white p-6 shadow-sm">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        {result && (
          <div className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={16} />
            <span>{result.message} ({result.recipientCount} recipient{result.recipientCount !== 1 ? 's' : ''})</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">Customers *</span>
            <select value={form.customers} onChange={(e) => setForm((p) => ({ ...p, customers: e.target.value }))}
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
              {FILTERS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>

          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">SMS Text *</span>
            <textarea required value={form.smsText} onChange={(e) => setForm((p) => ({ ...p, smsText: e.target.value }))}
              rows={7} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </label>

          <button type="submit" disabled={sending}
            className="rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50">
            {sending ? 'Sending...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
