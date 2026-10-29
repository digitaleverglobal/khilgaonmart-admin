import { useState, useEffect } from 'react';
import { siteSettingService } from '../../services/websiteService';

const SETTING_TYPE = 'social_media';

const DEFAULT_PLATFORMS = [
  { key: 'facebook',  label: 'Facebook',    url: '', active: true  },
  { key: 'instagram', label: 'Instagram',   url: '', active: true  },
  { key: 'youtube',   label: 'YouTube',     url: '', active: true  },
  { key: 'whatsapp',  label: 'WhatsApp',    url: '', active: true  },
  { key: 'messenger', label: 'Messenger',   url: '', active: true  },
  { key: 'telegram',  label: 'Telegram',    url: '', active: false },
  { key: 'twitter',   label: 'Twitter / X', url: '', active: false },
  { key: 'linkedin',  label: 'LinkedIn',    url: '', active: false },
  { key: 'tiktok',    label: 'TikTok',      url: '', active: false },
];

function mergePlatforms(saved) {
  if (!saved || !Array.isArray(saved)) return DEFAULT_PLATFORMS;
  const map = Object.fromEntries(saved.map((p) => [p.key, p]));
  return DEFAULT_PLATFORMS.map((p) => ({ ...p, ...(map[p.key] || {}) }));
}

export default function WebsiteSocialMediaPage() {
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  useEffect(() => {
    siteSettingService.get(SETTING_TYPE)
      .then((res) => { if (res.data?.data) setPlatforms(mergePlatforms(res.data.data)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setUrl(key, val)    { setPlatforms((prev) => prev.map((p) => p.key === key ? { ...p, url: val }          : p)); }
  function toggleStatus(key)   { setPlatforms((prev) => prev.map((p) => p.key === key ? { ...p, active: !p.active } : p)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await siteSettingService.upsert(SETTING_TYPE, platforms);
      setSuccess('Social media settings saved');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Social Media Update</h1>
        <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
          ▶ টিউটোরিয়াল দেখুন
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {error   && <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-600 text-xs">{error}</div>}
        {success && <div className="px-6 py-3 bg-green-50 border-b border-green-200 text-green-600 text-xs">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="hidden grid-cols-[220px_1fr_140px] bg-gray-100 border-b border-gray-200 md:grid lg:grid-cols-[280px_1fr_160px]">
            <div className="px-6 py-3 text-sm font-semibold text-gray-600 text-center">Platform</div>
            <div className="px-6 py-3 text-sm font-semibold text-gray-600 text-center">URL</div>
            <div className="px-6 py-3 text-sm font-semibold text-gray-600 text-center">Status</div>
          </div>

          {platforms.map((p) => (
            <div key={p.key} className="grid gap-3 border-b border-gray-100 p-4 last:border-0 hover:bg-gray-50/40 transition md:grid-cols-[220px_1fr_140px] md:items-center md:p-0 lg:grid-cols-[280px_1fr_160px]">
              <div className="px-6 py-4 text-sm text-gray-700">{p.label}</div>
              <div className="px-6 py-4">
                <input type="text" value={p.url} onChange={(e) => setUrl(p.key, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="px-6 py-4 flex justify-center">
                <button type="button" onClick={() => toggleStatus(p.key)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${p.active ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${p.active ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}

          <div className="px-6 py-5 border-t border-gray-100">
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
