import { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { siteSettingService } from '../../services/websiteService';
import { imageUrl } from '../../utils/assetUrl';

const SETTING_TYPE = 'website_footer';

const DEFAULT = {
  status: true,
  logoUrl: '',
  address: '',
  phone: '',
  email: '',
  quickLinksTitle: 'USEFUL LINK',
  quickLinks: [
    { label: 'Refund & Return Policy', url: '/page/refund-and-return-policy' },
    { label: 'Terms & Conditions', url: '/page/terms-and-conditions' },
    { label: 'Privacy Policy', url: '/page/privacy-policy' },
    { label: 'How To order', url: '/page/how-to-order' },
    { label: 'About Us', url: '/page/about-us' },
  ],
  customerLinksTitle: 'CUSTOMER LINK',
  customerLinks: [
    { label: 'Register', url: '/login?mode=register' },
    { label: 'Login', url: '/login' },
    { label: 'Forgot Password?', url: '/login' },
    { label: 'Contact', url: '/contact' },
  ],
  socialLinksTitle: 'FOLLOW US',
  socialLinks: [
    { platform: 'facebook', label: 'Facebook', url: '', active: true },
    { platform: 'instagram', label: 'Instagram', url: '', active: true },
    { platform: 'youtube', label: 'YouTube', url: '', active: true },
    { platform: 'whatsapp', label: 'WhatsApp', url: '', active: true },
    { platform: 'messenger', label: 'Messenger', url: '', active: true },
  ],
  deliveryPartnerTitle: 'DELIVERY PARTNER',
  deliveryPartnerUrl: '',
  deliveryPartners: [],
  copyrightText: 'Copyright © {year} Khilgaon Mart',
  paymentTitle: 'Pay With',
  paymentMethods: [],
  verifiedTitle: 'Verified by',
  verifiedImageUrl: '',
};

function readImage(file, onLoad) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result || ''));
  reader.readAsDataURL(file);
}

function TextField({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
      />
    </label>
  );
}

function ImageField({ label, value, onChange }) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <div className="rounded-lg border border-dashed border-gray-300 p-3">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => readImage(event.target.files?.[0], onChange)}
          className="w-full text-xs text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:text-gray-700"
        />
        <input
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Or paste image URL"
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
        />
        {value ? (
          <img src={imageUrl(value)} alt={label} className="mt-3 max-h-40 max-w-full rounded border border-gray-100 bg-gray-50 object-contain" />
        ) : (
          <div className="mt-3 flex h-20 items-center justify-center rounded bg-gray-50 text-gray-300">
            <ImageIcon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

function LinkEditor({ title, items, onChange, social = false }) {
  const update = (index, field, value) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        <button
          type="button"
          onClick={() => onChange([...items, social ? { platform: '', label: '', url: '', active: true } : { label: '', url: '' }])}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
        >
          <Plus size={14} /> Add Link
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className={`grid items-end gap-3 ${social ? 'md:grid-cols-[130px_1fr_1.5fr_90px_40px]' : 'md:grid-cols-[1fr_1.5fr_40px]'}`}>
            {social && <TextField label="Platform" value={item.platform} onChange={(value) => update(index, 'platform', value)} placeholder="facebook" />}
            <TextField label="Label" value={item.label} onChange={(value) => update(index, 'label', value)} />
            <TextField label="URL" value={item.url} onChange={(value) => update(index, 'url', value)} placeholder="https://..." />
            {social && (
              <button
                type="button"
                onClick={() => update(index, 'active', item.active === false)}
                className={`mb-0.5 h-10 rounded-lg text-xs font-semibold ${item.active === false ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}
              >
                {item.active === false ? 'Inactive' : 'Active'}
              </button>
            )}
            <button
              type="button"
              title="Remove link"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// A list of named images: delivery partners, payment method logos.
function ImageListEditor({ title, itemName, items, onChange, gridClassName = 'space-y-4' }) {
  const update = (index, field, value) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        <button
          type="button"
          onClick={() => onChange([...items, { label: '', imageUrl: '' }])}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
        >
          <Plus size={14} /> Add {itemName}
        </button>
      </div>

      <div className={gridClassName}>
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <TextField label={`${itemName} Name`} value={item.label} onChange={(value) => update(index, 'label', value)} />
              <button
                type="button"
                title={`Remove ${itemName.toLowerCase()}`}
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                className="mt-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <ImageField label={`${itemName} Image`} value={item.imageUrl} onChange={(value) => update(index, 'imageUrl', value)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function normalizeFooterData(data) {
  const merged = { ...DEFAULT, ...data };
  const deliveryPartners = Array.isArray(merged.deliveryPartners)
    ? merged.deliveryPartners
    : [];
  const hasLegacyPartner = merged.deliveryPartnerUrl
    && !deliveryPartners.some((item) => item?.imageUrl === merged.deliveryPartnerUrl);

  return {
    ...merged,
    deliveryPartners: hasLegacyPartner
      ? [{ label: '', imageUrl: merged.deliveryPartnerUrl }, ...deliveryPartners]
      : deliveryPartners,
  };
}

export default function WebsiteFooterPage() {
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    siteSettingService.get(SETTING_TYPE)
      .then((response) => {
        if (!active) return;
        const data = response?.data?.data || {};
        setForm(normalizeFooterData(data));
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const set = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        deliveryPartners: (form.deliveryPartners || []).filter((item) => item?.imageUrl),
        deliveryPartnerUrl: (form.deliveryPartners || []).find((item) => item?.imageUrl)?.imageUrl || '',
        paymentMethods: (form.paymentMethods || []).filter((item) => item?.imageUrl),
      };
      await siteSettingService.upsert(SETTING_TYPE, payload);
      setForm(normalizeFooterData(payload));
      setSuccess('Website footer saved successfully');
    } catch (err) {
      setError(err.message || 'Footer save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Loading footer...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-800">Website Footer</h1>
        <p className="mt-1 text-xs text-gray-500">Manage storefront footer logo, content, links, social icons, delivery partners and the copyright section.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-600">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-800">Logo Section With Content</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <ImageField label="Footer Logo" value={form.logoUrl} onChange={(value) => set('logoUrl', value)} />
            <div className="space-y-4">
              <TextField label="Address" value={form.address} onChange={(value) => set('address', value)} />
              <TextField label="Phone" value={form.phone} onChange={(value) => set('phone', value)} />
              <TextField label="Email" value={form.email} onChange={(value) => set('email', value)} />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-800">Section Titles</h2>
          <div className="grid gap-5 md:grid-cols-4">
            <TextField label="Useful Link Title" value={form.quickLinksTitle} onChange={(value) => set('quickLinksTitle', value)} />
            <TextField label="Customer Link Title" value={form.customerLinksTitle} onChange={(value) => set('customerLinksTitle', value)} />
            <TextField label="Follow Us Title" value={form.socialLinksTitle} onChange={(value) => set('socialLinksTitle', value)} />
            <TextField label="Delivery Partner Title" value={form.deliveryPartnerTitle} onChange={(value) => set('deliveryPartnerTitle', value)} />
          </div>
        </section>

        <LinkEditor title="Useful Links" items={form.quickLinks || []} onChange={(value) => set('quickLinks', value)} />
        <LinkEditor title="Customer Links" items={form.customerLinks || []} onChange={(value) => set('customerLinks', value)} />
        <LinkEditor title="Follow Us" items={form.socialLinks || []} onChange={(value) => set('socialLinks', value)} social />

        <ImageListEditor
          title="Delivery Partner"
          itemName="Partner"
          items={form.deliveryPartners || []}
          onChange={(value) => set('deliveryPartners', value)}
        />

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-gray-800">Copyright Section</h2>
          <p className="mb-4 text-xs text-gray-500">
            The bottom row of the footer. Write <code className="rounded bg-gray-100 px-1">{'{year}'}</code> in the copyright text to show the current year.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            <TextField label="Copyright Text" value={form.copyrightText} onChange={(value) => set('copyrightText', value)} placeholder="Copyright © {year} Khilgaon Mart" />
            <TextField label="Payment Title" value={form.paymentTitle} onChange={(value) => set('paymentTitle', value)} placeholder="Pay With" />
            <TextField label="Verified Badge Title" value={form.verifiedTitle} onChange={(value) => set('verifiedTitle', value)} placeholder="Verified by" />
          </div>
          <div className="mt-5 md:w-1/3">
            <ImageField label="Verified Badge Image (e.g. SSLCommerz)" value={form.verifiedImageUrl} onChange={(value) => set('verifiedImageUrl', value)} />
          </div>
        </section>

        <ImageListEditor
          title="Payment Methods"
          itemName="Payment"
          items={form.paymentMethods || []}
          onChange={(value) => set('paymentMethods', value)}
          gridClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        />

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-800">Footer Status</h2>
          <div className="mt-5">
            <span className="mb-2 block text-sm font-medium text-gray-700">Status</span>
            <button type="button" onClick={() => set('status', !form.status)} className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${form.status ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${form.status ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>

        <button type="submit" disabled={saving} className="rounded-lg bg-teal-500 px-7 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Website Footer'}
        </button>
      </form>
    </div>
  );
}
