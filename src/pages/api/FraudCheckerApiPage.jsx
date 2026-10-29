import { useState, useEffect } from 'react';
import { PlayCircle } from 'lucide-react';
import { siteSettingService } from '../../services/websiteService';
import { integrationService } from '../../services/integrationService';

const SETTING_TYPE = 'fraud_checker';

const DEFAULT = { steadfastEmail: '', steadfastPassword: '', redxPhone: '', redxPassword: '', paperflyUsername: '', paperflyPassword: '', pathaoBearerToken: '' };

export default function FraudCheckerApiPage() {
  const [form, setForm]       = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    siteSettingService.get(SETTING_TYPE)
      .then((res) => { if (res.data?.data) setForm({ ...DEFAULT, ...res.data.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setField(field, value) { setForm((prev) => ({ ...prev, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await siteSettingService.upsert(SETTING_TYPE, form);
      setSuccess('Fraud checker settings saved');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }
  async function handleTest() { setTesting(true); setError(''); setSuccess(''); try { await siteSettingService.upsert(SETTING_TYPE, form); await integrationService.test('fraud', 'all'); setSuccess('Fraud checker configuration is ready'); } catch (err) { setError(err.message); } finally { setTesting(false); } }

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Fraud Checker Setting</h1>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
          <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="mx-auto max-w-5xl rounded bg-white p-6 shadow-sm">
        {error   && <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">{error}</div>}
        {success && <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-600 text-xs rounded">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Steadfast Credentials">
            <Field label="Steadfast Email"><TextInput value={form.steadfastEmail} onChange={(v) => setField('steadfastEmail', v)} /></Field>
            <Field label="Password"><TextInput value={form.steadfastPassword} onChange={(v) => setField('steadfastPassword', v)} /></Field>
          </Section>

          <Section title="RedX Credentials">
            <Field label="Redx Phone"><TextInput value={form.redxPhone} onChange={(v) => setField('redxPhone', v)} /></Field>
            <Field label="Password"><TextInput value={form.redxPassword} onChange={(v) => setField('redxPassword', v)} /></Field>
          </Section>

          <Section title="Paperfly Credentials">
            <Field label="Username"><TextInput value={form.paperflyUsername} onChange={(v) => setField('paperflyUsername', v)} /></Field>
            <Field label="Password"><TextInput value={form.paperflyPassword} onChange={(v) => setField('paperflyPassword', v)} /></Field>
          </Section>

          <div>
            <h2 className="mb-6 text-sm font-bold text-indigo-600">Pathao</h2>
            <Field label="Bearer Token">
              <textarea value={form.pathaoBearerToken || ''} onChange={(e) => setField('pathaoBearerToken', e.target.value)} rows={4}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </Field>
          </div>

          <button type="submit" disabled={saving}
            className="rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Update'}
          </button>
          <button type="button" onClick={handleTest} disabled={testing} className="ml-2 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{testing ? 'Testing...' : 'Test Configuration'}</button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return <section><h2 className="mb-6 text-sm font-bold text-indigo-600">{title}</h2><div className="grid gap-6 lg:grid-cols-2">{children}</div></section>;
}
function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-500">{label}</span>{children}</label>;
}
function TextInput({ value, onChange }) {
  return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />;
}
