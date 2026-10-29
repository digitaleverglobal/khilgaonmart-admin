import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { tagManagerService } from '../../services/marketingService';

export default function TagManagerFormPage({ mode = 'create', tag, onSave, onNavigate }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({ tagManagerId: tag?.tagManagerId ?? '', status: tag?.status ?? 'Active' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { tagManagerId: form.tagManagerId.trim(), status: form.status };
      if (isEdit) { await tagManagerService.update(tag.Id, payload); }
      else         { await tagManagerService.create(payload); }
      onSave && onSave();
      onNavigate('tag_manager');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Tag Manager {isEdit ? 'Edit' : 'Create'}</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
            <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate('tag_manager')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Manage
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl rounded bg-white p-6 shadow-sm">
        {error && <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">Tag Manager ID *</span>
            <input type="text" required value={form.tagManagerId} onChange={(e) => setForm((p) => ({ ...p, tagManagerId: e.target.value }))}
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">Status</span>
            <button type="button" onClick={() => setForm((p) => ({ ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' }))}
              className={`relative inline-flex h-8 w-[58px] items-center rounded-full transition-colors duration-200 focus:outline-none ${form.status === 'Active' ? 'bg-sky-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${form.status === 'Active' ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </label>
          <button type="submit" disabled={saving} className="rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
