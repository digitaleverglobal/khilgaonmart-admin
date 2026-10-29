import { useState, useEffect } from 'react';
import {
  Bold, Underline, Italic, AlignLeft, List, ListOrdered,
  Link, Image, Film, Maximize2, Code, HelpCircle,
} from 'lucide-react';
import { siteSettingService } from '../../services/websiteService';
import { applyDocumentFavicon, normalizeSettingData } from '../../utils/siteBranding';
import { imageUrl } from '../../utils/assetUrl';
import RichEditor from '../../components/RichEditor';

const SETTING_TYPE = 'general';

// Shown on the checkout page until a policy is saved here.
const DEFAULT_DELIVERY_POLICY = `<h4>হোম ডেলিভারি পলিসি</h4>
<p>ঢাকা, চট্টগ্রাম এবং সিলেট শহরে আমাদের নিজস্ব হোম ডেলিভারি সুবিধা রয়েছে। হোম ডেলিভারি চার্জ মাত্র ৬০ টাকা।</p>
<ul>
<li>বহুতল ভবনের ২য় তলা পর্যন্ত যেকোন ওজনের পণ্য বিদ্যমান ডেলিভারি চার্জে সরবরাহ করা হবে।</li>
<li>২য় তলার উপরে ১৫ কেজি পর্যন্ত পণ্য বর্তমান চার্জে, এরপর প্রতি ৫ কেজি ওজনে অতিরিক্ত ১০ টাকা প্রযোজ্য।</li>
<li>ভবনে লিফট থাকলে এবং লিফটে পণ্য বহন করা গেলে অতিরিক্ত ডেলিভারি চার্জ প্রযোজ্য হবে না।</li>
</ul>
<h4>কুরিয়ার ডেলিভারি পলিসি:</h4>
<p>ঢাকা, চট্টগ্রাম, সিলেট ও কুমিল্লা শহর ব্যতীত যেসব এলাকায় আমাদের নিজস্ব হোম ডেলিভারি সেবা চালু নেই, সেসব এলাকায় কুরিয়ারের মাধ্যমে পণ্য সরবরাহ করা হয়। সেক্ষেত্রে নিম্নোক্ত শর্তাবলি প্রযোজ্য হবে—</p>
<h5>স্টেডফাস্ট কুরিয়ার:</h5>
<ul>
<li>ঢাকার বাইরে সারাদেশে কুরিয়ারের মাধ্যমে হোম ডেলিভারি প্রদান করা হবে।</li>
<li>হোম ডেলিভারির ক্ষেত্রে পার্সেলের ওজন সর্বোচ্চ ৩ কেজি পর্যন্ত ডেলিভারি চার্জ ১৬০ টাকা। ৩ কেজির বেশি হলে অতিরিক্ত প্রতি কেজির জন্য ২০ টাকা করে চার্জ প্রযোজ্য (প্যাকেজিং এর ওজন সহ)।</li>
<li>ঢাকার বাইরে হাব অফিস থেকে নিলে প্রতি কেজি ১৫ টাকা ডেলিভারি চার্জ (অন্তত ১০ কেজি ওজন হতে হবে) (প্যাকেজিং এর ওজন সহ)।</li>
<li>ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য। তবে কুরিয়ার চার্জ বাবদ ন্যূনতম ১৬০ টাকা অগ্রিম পরিশোধ করতে হবে।</li>
<li>পার্সেল বুকিংয়ের পর ডেলিভারি সম্পন্ন হতে সর্বোচ্চ ২-৩ দিন সময় লাগতে পারে।</li>
<li>যেকোনো পচনশীল পণ্য কুরিয়ারের মাধ্যমে পাঠানো হবে না।</li>
</ul>`;

const DEFAULT = {
  name: '', whiteLogo: null, darkLogo: null, faviconLogo: null,
  logoFile: '', faviconFile: '',
  scrollText: '', metaTitle: '', metaKeyword: '', metaDescription: '',
  marqueeText: '',
  bkashNumber: '', nagadNumber: '', rocketNumber: '',
  deliveryPolicyTitle: 'হোম ডেলিভারি পলিসি', deliveryPolicy: DEFAULT_DELIVERY_POLICY,
  orderBlockLimit: '', blockTime: '', timeUnit: 'Hour', status: true,
  invoicePrefix: 'HD', invoiceDigits: 4,
};

// Mirrors the backend's cleanup of the prefix so the preview matches new orders.
const cleanInvoicePrefix = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

function normalizeSettings(data = {}) {
  const next = { ...DEFAULT, ...normalizeSettingData(data) };
  next.whiteLogo = next.whiteLogo || next.logoFile || null;
  next.darkLogo = next.darkLogo || next.logoFile || null;
  next.faviconLogo = next.faviconLogo || next.faviconFile || null;
  next.logoFile = next.logoFile || next.darkLogo || next.whiteLogo || '';
  next.faviconFile = next.faviconFile || next.faviconLogo || '';
  next.scrollText = next.scrollText || next.marqueeText || '';
  next.marqueeText = next.marqueeText || next.scrollText || '';
  next.deliveryPolicyTitle = next.deliveryPolicyTitle || DEFAULT.deliveryPolicyTitle;
  next.deliveryPolicy = next.deliveryPolicy || DEFAULT_DELIVERY_POLICY;
  return next;
}

function ToolbarBtn({ icon }) {
  return (
    <button type="button" className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 transition">
      {icon}
    </button>
  );
}
function Sep() { return <div className="w-px h-4 bg-gray-200 mx-0.5" />; }

function RichTextEditor({ value, onChange }) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <ToolbarBtn icon={<span className="text-xs font-bold">⚙</span>} /><Sep />
        <ToolbarBtn icon={<Bold size={12} />} /><ToolbarBtn icon={<Underline size={12} />} />
        <ToolbarBtn icon={<Italic size={12} />} /><Sep />
        <select className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600 focus:outline-none">
          <option>sans-serif</option><option>serif</option><option>monospace</option>
        </select><Sep />
        <ToolbarBtn icon={<List size={12} />} /><ToolbarBtn icon={<ListOrdered size={12} />} />
        <ToolbarBtn icon={<AlignLeft size={12} />} /><Sep />
        <ToolbarBtn icon={<Link size={12} />} /><ToolbarBtn icon={<Image size={12} />} /><ToolbarBtn icon={<Film size={12} />} /><Sep />
        <ToolbarBtn icon={<Maximize2 size={12} />} /><ToolbarBtn icon={<Code size={12} />} /><ToolbarBtn icon={<HelpCircle size={12} />} />
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Enter Your Text Here" rows={4}
        className="w-full px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none" />
    </div>
  );
}

function LogoField({ label, preview, onChange }) {
  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result || '');
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} <span className="text-red-500">*</span></label>
      <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200" />
      {preview
        ? <img src={imageUrl(preview)} alt="logo" className="mt-2 w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm" />
        : <div className="mt-2 w-12 h-12 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"><span className="text-gray-300 text-xs">Logo</span></div>
      }
    </div>
  );
}

export default function WebsiteGeneralSettingPage() {
  const [form, setForm]     = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    siteSettingService.get(SETTING_TYPE)
      .then((res) => { if (res.data?.data) setForm(normalizeSettings(res.data.data)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }
  function setLogo(v) {
    setForm((p) => ({ ...p, whiteLogo: v, logoFile: v }));
  }
  function setDarkLogo(v) {
    setForm((p) => ({ ...p, darkLogo: v, logoFile: p.logoFile || v }));
  }
  function setFavicon(v) {
    setForm((p) => ({ ...p, faviconLogo: v, faviconFile: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        logoFile: form.logoFile || form.darkLogo || form.whiteLogo || null,
        faviconFile: form.faviconFile || form.faviconLogo || null,
        marqueeText: form.marqueeText || form.scrollText || null,
      };
      await siteSettingService.upsert(SETTING_TYPE, payload);
      setForm(normalizeSettings(payload));
      applyDocumentFavicon(payload.faviconFile);
      window.dispatchEvent(new CustomEvent('site-settings:update', { detail: payload }));
      setSuccess('Settings saved successfully');
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
        <h1 className="text-lg font-bold text-gray-800">General Setting Update</h1>
        <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
          ▶ টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {error   && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}
        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-600 text-xs rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <LogoField label="White Logo" preview={form.whiteLogo || form.logoFile} onChange={setLogo} />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <LogoField label="Dark Logo"    preview={form.darkLogo || form.logoFile}    onChange={setDarkLogo} />
            <LogoField label="Favicon Logo" preview={form.faviconLogo || form.faviconFile} onChange={setFavicon} />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frontend Logo URL / File</label>
              <input type="text" value={form.logoFile || ''} onChange={(e) => set('logoFile', e.target.value)} placeholder="https://... or uploaded file name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frontend Favicon URL / File</label>
              <input type="text" value={form.faviconFile || ''} onChange={(e) => set('faviconFile', e.target.value)} placeholder="https://... or uploaded file name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scroll Text</label>
            <RichTextEditor value={form.scrollText} onChange={(v) => { set('scrollText', v); set('marqueeText', v); }} />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title (SEO)</label>
              <input type="text" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keyword (SEO)</label>
              <input type="text" value={form.metaKeyword} onChange={(e) => set('metaKeyword', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (SEO)</label>
            <textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[['bkashNumber', 'Bkash Number'], ['nagadNumber', 'Nagad Number'], ['rocketNumber', 'Rocket Number']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" value={form[k]} onChange={(e) => set(k, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Checkout Delivery Policy Title</label>
            <input type="text" value={form.deliveryPolicyTitle} onChange={(e) => set('deliveryPolicyTitle', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          <div>
            <RichEditor label="Checkout Delivery Policy" value={form.deliveryPolicy} onChange={(v) => set('deliveryPolicy', v)} />
            <p className="mt-1 text-xs text-gray-400">চেকআউট পেজে &quot;অর্ডার কনফার্ম করুন&quot; বাটনের নিচে দেখাবে।</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Block Limit</label>
              <input type="text" value={form.orderBlockLimit} onChange={(e) => set('orderBlockLimit', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block Time</label>
              <input type="text" value={form.blockTime} onChange={(e) => set('blockTime', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Unit</label>
              <input type="text" value={form.timeUnit} onChange={(e) => set('timeUnit', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-800">Invoice ID</h2>
            <p className="mt-0.5 mb-4 text-xs text-gray-500">
              নতুন অর্ডারের Invoice ID এই ফরম্যাটে তৈরি হবে। আগের অর্ডারের ID বদলাবে না, এবং পুরনো ID দিয়েও সার্চ করা যাবে।
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                <input type="text" value={form.invoicePrefix} maxLength={10}
                  onChange={(e) => set('invoicePrefix', cleanInvoicePrefix(e.target.value))}
                  placeholder="HD"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none focus:border-blue-400" />
                <p className="mt-1 text-xs text-gray-400">অক্ষর দিয়ে শুরু; শুধু A–Z ও 0–9।</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number Digits</label>
                <input type="number" min={1} max={10} value={form.invoiceDigits}
                  onChange={(e) => set('invoiceDigits', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                <p className="mt-1 text-xs text-gray-400">নাম্বারের আগে শূন্য দিয়ে কত ঘর হবে (যেমন 4 → 0007)।</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Preview</span>
                <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-600">
                  {(/^[A-Z]/.test(form.invoicePrefix || '') ? form.invoicePrefix : 'HD')}-{'7'.padStart(Math.min(Math.max(Number(form.invoiceDigits) || 4, 1), 10), '0')}
                </div>
              </div>
            </div>
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
