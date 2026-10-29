import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { siteSettingService } from '../../services/websiteService';

const SETTING_TYPE = 'reward';

// Same defaults as the backend (app/modules/reward/reward.settings.js).
const DEFAULT_TIERS = [
  { name: 'Silver', minSpend: 0, multiplier: 1, freeDelivery: false },
  { name: 'Gold', minSpend: 10000, multiplier: 1.5, freeDelivery: false },
  { name: 'Platinum', minSpend: 30000, multiplier: 2, freeDelivery: true },
];

const DEFAULT = {
  enabled: false,
  earnAmount: 100,
  earnPoints: 1,
  pointValue: 1,
  minRedeemPoints: 10,
  maxRedeemPercent: 20,
  expiryMonths: 12,
  expiryReminderDays: 7,
  signupBonus: 20,
  firstOrderBonus: 50,
  reviewBonus: 5,
  referralBonus: 100,
  smsEnabled: true,
  tiersEnabled: true,
  tiers: DEFAULT_TIERS,
};

function NumberField({ label, hint, value, onChange, min = 0, step = 1, suffix }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 focus-within:border-blue-400">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-3 py-2.5 text-sm outline-none"
        />
        {suffix && <span className="whitespace-nowrap bg-gray-50 px-3 py-2.5 text-xs text-gray-500">{suffix}</span>}
      </div>
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
      aria-pressed={Boolean(checked)}
      aria-label={label}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-8' : 'translate-x-1'}`} />
    </button>
  );
}

function Section({ title, description, action, children }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const toNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

export default function WebsiteRewardPage() {
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
        setForm({ ...DEFAULT, ...data, tiers: Array.isArray(data.tiers) && data.tiers.length ? data.tiers : DEFAULT_TIERS });
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const set = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));
  const setTier = (index, field, value) =>
    set('tiers', form.tiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)));

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const tiers = form.tiers
        .filter((tier) => String(tier.name || '').trim())
        .map((tier) => ({
          name: String(tier.name).trim(),
          minSpend: Math.floor(toNumber(tier.minSpend, 0)),
          multiplier: toNumber(tier.multiplier, 1) || 1,
          freeDelivery: Boolean(tier.freeDelivery),
        }))
        .sort((a, b) => a.minSpend - b.minSpend);
      if (tiers.length) tiers[0].minSpend = 0;
      const payload = {
        enabled: Boolean(form.enabled),
        earnAmount: toNumber(form.earnAmount, 0) || DEFAULT.earnAmount,
        earnPoints: Math.floor(toNumber(form.earnPoints, 0)) || DEFAULT.earnPoints,
        pointValue: toNumber(form.pointValue, 0) || DEFAULT.pointValue,
        minRedeemPoints: Math.floor(toNumber(form.minRedeemPoints, 0)) || DEFAULT.minRedeemPoints,
        maxRedeemPercent: Math.min(100, toNumber(form.maxRedeemPercent, 0) || DEFAULT.maxRedeemPercent),
        expiryMonths: Math.floor(toNumber(form.expiryMonths, DEFAULT.expiryMonths)),
        expiryReminderDays: Math.floor(toNumber(form.expiryReminderDays, DEFAULT.expiryReminderDays)),
        signupBonus: Math.floor(toNumber(form.signupBonus, 0)),
        firstOrderBonus: Math.floor(toNumber(form.firstOrderBonus, 0)),
        reviewBonus: Math.floor(toNumber(form.reviewBonus, 0)),
        referralBonus: Math.floor(toNumber(form.referralBonus, 0)),
        smsEnabled: Boolean(form.smsEnabled),
        tiersEnabled: Boolean(form.tiersEnabled),
        tiers: tiers.length ? tiers : DEFAULT_TIERS,
      };
      await siteSettingService.upsert(SETTING_TYPE, payload);
      setForm(payload);
      setSuccess('Reward setting saved successfully');
    } catch (err) {
      setError(err.message || 'Reward setting save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Loading...</div>;

  const earnAmount = Number(form.earnAmount) || 0;
  const examplePoints = earnAmount > 0 ? Math.floor(1000 / earnAmount) * (Math.floor(Number(form.earnPoints)) || 0) : 0;
  const exampleValue = examplePoints * (Number(form.pointValue) || 0);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-800">Customer Reward</h1>
        <p className="mt-1 text-xs text-gray-500">
          ডেলিভারি হওয়া অর্ডার আর বোনাসে কাস্টমার পয়েন্ট পাবে, লগইন করে চেকআউটে পয়েন্ট দিয়ে ডিসকাউন্ট নিতে পারবে।
        </p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-600">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section
          title="Reward Program"
          description="বন্ধ থাকলে নতুন পয়েন্ট জমা হবে না এবং চেকআউটে পয়েন্ট ব্যবহার করা যাবে না।"
          action={<Toggle checked={form.enabled} onChange={(v) => set('enabled', v)} label="Reward program" />}
        />

        <Section title="পয়েন্ট জমা (Earn)">
          <div className="grid gap-5 md:grid-cols-2">
            <NumberField label="প্রতি কত টাকার কেনাকাটায়" value={form.earnAmount} min={1} suffix="৳"
              hint="ডেলিভারি চার্জ বাদে, ডিসকাউন্টের পরে পণ্যের দাম" onChange={(v) => set('earnAmount', v)} />
            <NumberField label="কত পয়েন্ট পাবে" value={form.earnPoints} min={1} suffix="পয়েন্ট"
              onChange={(v) => set('earnPoints', v)} />
          </div>
        </Section>

        <Section title="পয়েন্ট ব্যবহার (Redeem)">
          <div className="grid gap-5 md:grid-cols-3">
            <NumberField label="১ পয়েন্টের মূল্য" value={form.pointValue} min={0.01} step={0.01} suffix="৳"
              onChange={(v) => set('pointValue', v)} />
            <NumberField label="সর্বনিম্ন পয়েন্ট" value={form.minRedeemPoints} min={1} suffix="পয়েন্ট"
              hint="এর কম পয়েন্ট একবারে ব্যবহার করা যাবে না" onChange={(v) => set('minRedeemPoints', v)} />
            <NumberField label="সর্বোচ্চ ডিসকাউন্ট" value={form.maxRedeemPercent} min={1} suffix="%"
              hint="পণ্যের দামের কত শতাংশ পর্যন্ত পয়েন্ট দিয়ে দেওয়া যাবে" onChange={(v) => set('maxRedeemPercent', v)} />
          </div>
        </Section>

        <Section title="মেয়াদ (Expiry)" description="পুরনো পয়েন্ট আগে খরচ হয়; যা বাকি থাকে তার মেয়াদ শেষ হয়।">
          <div className="grid gap-5 md:grid-cols-2">
            <NumberField label="পয়েন্টের মেয়াদ" value={form.expiryMonths} min={0} suffix="মাস"
              hint="পয়েন্ট পাওয়ার কত মাস পরে মেয়াদ শেষ (0 = কখনো না)" onChange={(v) => set('expiryMonths', v)} />
            <NumberField label="রিমাইন্ডার SMS" value={form.expiryReminderDays} min={0} suffix="দিন আগে"
              hint="মেয়াদ শেষের কত দিন আগে SMS যাবে (0 = পাঠাবে না)" onChange={(v) => set('expiryReminderDays', v)} />
          </div>
        </Section>

        <Section title="বোনাস পয়েন্ট" description="প্রতিটি একবারই পাওয়া যায় (রিভিউ বোনাস প্রতি পণ্যে একবার)। 0 দিলে বন্ধ।">
          <div className="grid gap-5 md:grid-cols-4">
            <NumberField label="অ্যাকাউন্ট খোলা" value={form.signupBonus} suffix="পয়েন্ট" onChange={(v) => set('signupBonus', v)} />
            <NumberField label="প্রথম অর্ডার ডেলিভারি" value={form.firstOrderBonus} suffix="পয়েন্ট" onChange={(v) => set('firstOrderBonus', v)} />
            <NumberField label="রিভিউ (অনুমোদিত হলে)" value={form.reviewBonus} suffix="পয়েন্ট"
              hint="শুধু ডেলিভারি পাওয়া পণ্যে" onChange={(v) => set('reviewBonus', v)} />
            <NumberField label="রেফারেল (দুজনেই)" value={form.referralBonus} suffix="পয়েন্ট"
              hint="বন্ধুর প্রথম অর্ডার ডেলিভারি হলে" onChange={(v) => set('referralBonus', v)} />
          </div>
        </Section>

        <Section
          title="SMS"
          description="পয়েন্ট পেলে আর মেয়াদ শেষের আগে কাস্টমারকে SMS যাবে (SMS gateway সেট থাকতে হবে)।"
          action={<Toggle checked={form.smsEnabled} onChange={(v) => set('smsEnabled', v)} label="Reward SMS" />}
        />

        <Section
          title="মেম্বারশিপ লেভেল (Tier)"
          description="গত ১২ মাসে ডেলিভারি হওয়া কেনাকাটা অনুযায়ী লেভেল। গুণক অনুযায়ী বেশি পয়েন্ট, আর চাইলে ফ্রি ডেলিভারি।"
          action={<Toggle checked={form.tiersEnabled} onChange={(v) => set('tiersEnabled', v)} label="Tiers" />}
        >
          {form.tiersEnabled && (
            <div className="space-y-3">
              {form.tiers.map((tier, index) => (
                <div key={index} className="grid items-end gap-3 md:grid-cols-[1fr_1fr_1fr_140px_40px]">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">নাম</span>
                    <input
                      value={tier.name}
                      onChange={(e) => setTier(index, 'name', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                  <NumberField label="সর্বনিম্ন কেনাকাটা" value={index === 0 ? 0 : tier.minSpend} suffix="৳"
                    onChange={(v) => setTier(index, 'minSpend', v)} />
                  <NumberField label="পয়েন্ট গুণক" value={tier.multiplier} min={1} step={0.1} suffix="x"
                    onChange={(v) => setTier(index, 'multiplier', v)} />
                  <label className="mb-1 flex h-10 items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(tier.freeDelivery)}
                      onChange={(e) => setTier(index, 'freeDelivery', e.target.checked)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    ফ্রি ডেলিভারি
                  </label>
                  <button
                    type="button"
                    title="Remove tier"
                    disabled={form.tiers.length <= 1}
                    onClick={() => set('tiers', form.tiers.filter((_, i) => i !== index))}
                    className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('tiers', [...form.tiers, { name: '', minSpend: 0, multiplier: 1, freeDelivery: false }])}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
              >
                <Plus size={14} /> Add Tier
              </button>
              <p className="text-xs text-gray-400">প্রথম লেভেল সবার জন্য (৳0 থেকে)। সেভ করলে কেনাকাটার পরিমাণ অনুযায়ী সাজানো হবে।</p>
            </div>
          )}
        </Section>

        <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700">
          উদাহরণ: ৳1,000 এর পণ্য ডেলিভারি হলে কাস্টমার <b>{examplePoints} পয়েন্ট</b> পাবে (প্রথম লেভেলে), যার মূল্য <b>৳{exampleValue.toLocaleString()}</b>।
          অর্ডার বাতিল বা রিটার্ন হলে ব্যবহার করা পয়েন্ট ফেরত যাবে, আর ডেলিভারি বাতিল হলে পাওয়া পয়েন্ট কেটে নেওয়া হবে।
        </div>

        <button type="submit" disabled={saving} className="rounded-lg bg-teal-500 px-7 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Reward Setting'}
        </button>
      </form>
    </div>
  );
}
