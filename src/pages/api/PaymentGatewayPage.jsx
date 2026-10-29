import { useState, useEffect } from 'react';
import { PlayCircle } from 'lucide-react';
import { siteSettingService } from '../../services/websiteService';
import { integrationService } from '../../services/integrationService';

const SETTING_TYPE = 'payment_gateway';

const DEFAULT_CONFIGS = {
  bkash:     { label: 'Bkash',     title: 'Bkash Gateway',     userName: '', appKey: '', appSecret: '', baseUrl: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta', password: '', status: true },
  shurjopay: { label: 'Shurjopay', title: 'Shurjopay Gateway', userName: '', appKey: '', appSecret: '', baseUrl: 'https://engine.shurjopayment.com/api',           password: '', status: false },
};

export default function PaymentGatewayPage() {
  const [activeGateway, setActiveGateway] = useState('bkash');
  const [forms, setForms]   = useState(DEFAULT_CONFIGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    siteSettingService.get(SETTING_TYPE)
      .then((res) => {
        const data = res.data?.data;
        if (!data || typeof data !== 'object' || Array.isArray(data)) return;
        setForms({
          bkash: { ...DEFAULT_CONFIGS.bkash, ...(data.bkash && typeof data.bkash === 'object' ? data.bkash : {}) },
          shurjopay: { ...DEFAULT_CONFIGS.shurjopay, ...(data.shurjopay && typeof data.shurjopay === 'object' ? data.shurjopay : {}) },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setField(field, value) {
    setForms((prev) => ({ ...prev, [activeGateway]: { ...prev[activeGateway], [field]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await siteSettingService.upsert(SETTING_TYPE, forms);
      setSuccess('Payment gateway settings saved');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }
  async function handleTest() { setTesting(true); setError(''); setSuccess(''); try { await siteSettingService.upsert(SETTING_TYPE, forms); await integrationService.test('payment', activeGateway); setSuccess(`${form.label} connection successful`); } catch (err) { setError(err.message); } finally { setTesting(false); } }

  const form = forms[activeGateway];
  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Payment Gateway</h1>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
          <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="rounded bg-white p-5 shadow-sm">
        {error   && <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">{error}</div>}
        {success && <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-600 text-xs rounded">{success}</div>}

        <div className="grid gap-6 lg:grid-cols-[214px_1fr]">
          <div className="space-y-2">
            {Object.entries(forms).map(([key, item]) => (
              <button key={key} type="button" onClick={() => setActiveGateway(key)}
                className={`h-10 w-full rounded border text-sm font-semibold transition ${activeGateway === key ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-indigo-500 bg-white text-indigo-600 hover:bg-indigo-50'}`}>
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="rounded bg-gray-100 p-6 lg:p-8">
            <h2 className="mb-3 text-lg font-bold text-gray-800">{form.title}</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              <Field label="User Name" required><TextInput value={form.userName} onChange={(v) => setField('userName', v)} /></Field>
              <Field label="App Key"   required><TextInput value={form.appKey}   onChange={(v) => setField('appKey', v)} /></Field>
              <Field label="App Secret" required><TextInput value={form.appSecret} onChange={(v) => setField('appSecret', v)} /></Field>
              <Field label="Base Url"  required><TextInput type="url" value={form.baseUrl} onChange={(v) => setField('baseUrl', v)} /></Field>
              <Field label="Password"  required><TextInput value={form.password} onChange={(v) => setField('password', v)} /></Field>
              <Field label="Status"><Toggle checked={form.status} onChange={() => setField('status', !form.status)} /></Field>
            </div>
            <button type="submit" disabled={saving}
              className="mt-6 rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Submit'}
            </button>
            <button type="button" onClick={handleTest} disabled={testing} className="ml-2 mt-6 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{testing ? 'Testing...' : 'Test Connection'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-500">{label} {required && <span>*</span>}</span>{children}</label>;
}
function TextInput({ type = 'text', value, onChange }) {
  return <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />;
}
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className={`relative inline-flex h-8 w-[58px] items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-sky-500' : 'bg-gray-300'}`}>
      <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}
