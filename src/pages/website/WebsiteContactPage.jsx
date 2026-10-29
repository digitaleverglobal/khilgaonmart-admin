import { useState, useEffect } from 'react';
import { siteSettingService } from '../../services/websiteService';

const SETTING_TYPE = 'contact';

const DEFAULT = {
  hotlineNumber: '', hotMail: '',
  phoneNumber: '', email: '',
  address: '', whatsappNumber: '',
  mapLink: '', status: true,
};

export default function WebsiteContactPage() {
  const [form, setForm]       = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    siteSettingService.get(SETTING_TYPE)
      .then((res) => { if (res.data?.data) setForm({ ...DEFAULT, ...res.data.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await siteSettingService.upsert(SETTING_TYPE, form);
      setSuccess('Contact settings saved');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-bold text-gray-800">Contact Edit</h1>
        <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
          ▶ টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {error   && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}
        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-600 text-xs rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Hotline Number" value={form.hotlineNumber} onChange={(v) => set('hotlineNumber', v)} />
            <Field label="Hot Mail"       value={form.hotMail}       onChange={(v) => set('hotMail', v)} />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Phone Number" required value={form.phoneNumber} onChange={(v) => set('phoneNumber', v)} />
            <Field label="Email"                  value={form.email}       onChange={(v) => set('email', v)} />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Address" required value={form.address}       onChange={(v) => set('address', v)} />
            <Field label="Whatsapp Number"    value={form.whatsappNumber} onChange={(v) => set('whatsappNumber', v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Map Link</label>
            <input type="text" value={form.mapLink} onChange={(e) => set('mapLink', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-mono text-xs" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <button type="button" onClick={() => set('status', !form.status)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${form.status ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${form.status ? 'translate-x-8' : 'translate-x-1'}`} />
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

function Field({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
    </div>
  );
}
