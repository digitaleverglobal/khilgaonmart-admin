import { useState } from 'react';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );
}

import { colorService } from '../../services/productService';

export default function ColorEditPage({ color, onNavigate }) {
  const [name, setName] = useState(color?.name || '');
  const [hex, setHex] = useState(color?.hex || '#8B0000');
  const [status, setStatus] = useState(color?.status === 'Active' || color?.status === 'active');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError('Color Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await colorService.update(color.Id, { name: name.trim(), hex, status: status ? 'Active' : 'Inactive' });
      onNavigate && onNavigate('colors');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Color Edit</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('colors')} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            Manage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Color Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className={`w-full border rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white ${error ? 'border-red-400' : 'border-gray-300'}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="w-full h-[38px] border border-gray-300 rounded cursor-pointer p-0.5 bg-white"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <Toggle checked={status} onChange={setStatus} />
        </div>

        <div>
          <button type="button" onClick={handleSubmit} disabled={saving} className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2 rounded-lg transition">
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
