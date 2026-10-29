import { useState } from 'react';
import { Video } from 'lucide-react';
import { attributeService } from '../../services/productService';

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <span className={`mt-1 inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}

export default function AttributeFormPage({ attribute, mode = 'create', onNavigate }) {
  const [name, setName] = useState(attribute?.name || '');
  const [status, setStatus] = useState((attribute?.status || 'Active').toLowerCase() === 'active');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = mode === 'edit';

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Attribute name is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        status: status ? 'Active' : 'Inactive',
      };
      if (isEdit && attribute?.Id) {
        await attributeService.update(attribute.Id, payload);
      } else {
        await attributeService.create(payload);
      }
      onNavigate && onNavigate('attribute');
    } catch (e) {
      setError(e.message || 'Attribute save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold text-gray-800">Attribute {isEdit ? 'Edit' : 'Create'}</h1>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition">
            <Video size={14} />
            টিউটোরিয়াল দেখুন
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('attribute')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-full transition"
          >
            Manage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-3">Attribute Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className={`${inputCls} ${error ? 'border-red-400' : ''}`}
            />
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>

          <div>
            <span className="block text-sm font-bold text-gray-500 mb-2">Status</span>
            <Toggle checked={status} onChange={setStatus} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="mt-6 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded transition"
        >
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
