import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { siteSettingService } from '../../services/websiteService';
import { normalizeSettingData } from '../../utils/siteBranding';

const SETTING_TYPE = 'order_block';

const RULE_OPTIONS = [
  { value: 'same_ip', label: 'Same IP' },
  { value: 'same_device', label: 'Same Device' },
  { value: 'invalid_phone', label: 'Invalid Phone' },
  { value: 'suspicious_address', label: 'Address Looks Fake / Unknown / Gibberish' },
];

const DURATION_OPTIONS = [
  { value: '1:Hour', label: '1 Hour', durationValue: 1, durationUnit: 'Hour' },
  { value: '1:Day', label: '1 Day', durationValue: 1, durationUnit: 'Day' },
  { value: '1:Month', label: '1 Month', durationValue: 1, durationUnit: 'Month' },
  { value: '0:Unknown', label: 'Unknown Time', durationValue: 0, durationUnit: 'Unknown' },
];

const DEFAULT_RULE = {
  key: 'same_ip',
  enabled: true,
  durationValue: 1,
  durationUnit: 'Hour',
};

const DEFAULT = {
  status: true,
  rules: [
    { ...DEFAULT_RULE },
  ],
};

function normalizeDurationValue(rule = {}) {
  const unit = String(rule.durationUnit || rule.timeUnit || 'Hour');
  const value = unit === 'Unknown' ? 0 : Number(rule.durationValue || rule.blockTime || rule.time || 1);
  return `${value}:${unit}`;
}

function normalizeRule(rule = {}) {
  return {
    key: rule.key || rule.type || rule.category || 'same_ip',
    enabled: rule.enabled !== false && rule.status !== false,
    durationValue: Number(rule.durationValue || rule.blockTime || rule.time || 1),
    durationUnit: rule.durationUnit || rule.timeUnit || 'Hour',
  };
}

function normalizeSettings(data = {}) {
  const normalized = normalizeSettingData(data);
  const rules = Array.isArray(normalized.rules)
    ? normalized.rules
    : Object.entries(normalized.rules || {}).map(([key, rule]) => ({ key, ...rule }));

  return {
    status: normalized.status !== false,
    rules: rules.length ? rules.map(normalizeRule) : DEFAULT.rules,
  };
}

export default function WebsiteOrderBlockPage() {
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    siteSettingService.get(SETTING_TYPE)
      .then((res) => {
        if (res.data?.data) setForm(normalizeSettings(res.data.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedKeys = useMemo(() => form.rules.map((rule) => rule.key), [form.rules]);

  function updateRule(index, patch) {
    setForm((previous) => ({
      ...previous,
      rules: previous.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
    }));
  }

  function setDuration(index, optionValue) {
    const option = DURATION_OPTIONS.find((item) => item.value === optionValue) || DURATION_OPTIONS[0];
    updateRule(index, {
      durationValue: option.durationValue,
      durationUnit: option.durationUnit,
    });
  }

  function addRule() {
    const nextOption = RULE_OPTIONS.find((option) => !selectedKeys.includes(option.value)) || RULE_OPTIONS[0];
    setForm((previous) => ({
      ...previous,
      rules: [...previous.rules, { ...DEFAULT_RULE, key: nextOption.value }],
    }));
  }

  function removeRule(index) {
    setForm((previous) => ({
      ...previous,
      rules: previous.rules.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        status: form.status,
        rules: form.rules.map((rule) => ({
          key: rule.key,
          enabled: rule.enabled,
          durationValue: rule.durationUnit === 'Unknown' ? 0 : Number(rule.durationValue || 1),
          durationUnit: rule.durationUnit,
        })),
      };
      await siteSettingService.upsert(SETTING_TYPE, payload);
      setForm(normalizeSettings(payload));
      setSuccess('Order block settings saved successfully');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-bold text-gray-800">Order Block Setting</h1>
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
        >
          <Plus size={14} /> Add Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}
        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-600 text-xs rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <button
              type="button"
              onClick={() => setForm((previous) => ({ ...previous, status: !previous.status }))}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${form.status ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${form.status ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500">
                  <th className="px-3 py-3">Rule Category</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Block Time</th>
                  <th className="px-3 py-3 w-16">Remove</th>
                </tr>
              </thead>
              <tbody>
                {form.rules.map((rule, index) => (
                  <tr key={`${rule.key}-${index}`} className="border-b border-gray-100">
                    <td className="px-3 py-3">
                      <select
                        value={rule.key}
                        onChange={(event) => updateRule(index, { key: event.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      >
                        {RULE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={rule.enabled ? 'block' : 'off'}
                        onChange={(event) => updateRule(index, { enabled: event.target.value === 'block' })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      >
                        <option value="block">Block</option>
                        <option value="off">Off</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={normalizeDurationValue(rule)}
                        onChange={(event) => setDuration(index, event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      >
                        {DURATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        disabled={form.rules.length === 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
