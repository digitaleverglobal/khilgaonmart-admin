import { useState } from 'react';
import { tiktokPixelService } from '../../services/marketingService';

export default function TiktokPixelFormPage({ mode = 'create', pixel, onSave, onNavigate }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    pixelCode: pixel?.pixelCode || '',
    accessToken: pixel?.accessToken || '',
    testEventCode: pixel?.testEventCode || '',
    status: pixel?.status || 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      pixelCode: form.pixelCode.trim(),
      accessToken: form.accessToken.trim(),
      testEventCode: form.testEventCode.trim(),
      status: form.status,
    };
    try {
      if (isEdit) await tiktokPixelService.update(pixel.Id, payload);
      else await tiktokPixelService.create(payload);
      onSave?.();
      onNavigate('tiktok_pixels');
    } catch (err) {
      setError(err.message || 'TikTok pixel save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">TikTok Pixel {isEdit ? 'Edit' : 'Create'}</h1>
        <button onClick={() => onNavigate('tiktok_pixels')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Manage</button>
      </div>
      <form onSubmit={submit} className="mx-auto max-w-5xl rounded bg-white p-6 shadow-sm">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</div>}
        {[
          ['pixelCode', 'TikTok Pixel Code', true],
          ['accessToken', 'TikTok Access Token', true],
          ['testEventCode', 'Test Event Code', false],
        ].map(([key, label, required]) => (
          <label key={key} className="mb-5 block">
            <span className="mb-2 block text-sm font-semibold text-gray-600">{label} {required && '*'}</span>
            <input type={key === 'accessToken' ? 'password' : 'text'} autoComplete="off" required={required} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-indigo-400" />
          </label>
        ))}
        <label className="mb-6 block">
          <span className="mb-2 block text-sm font-semibold text-gray-600">Status</span>
          <button type="button" onClick={() => setForm((p) => ({ ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' }))}
            className={`relative inline-flex h-8 w-[58px] items-center rounded-full ${form.status === 'Active' ? 'bg-sky-500' : 'bg-gray-300'}`}>
            <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition ${form.status === 'Active' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </label>
        <button disabled={saving} className="rounded bg-teal-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Submit'}</button>
      </form>
    </div>
  );
}
