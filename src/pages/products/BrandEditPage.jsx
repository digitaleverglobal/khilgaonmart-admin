import { useState } from 'react';
import { brandService } from '../../services/productService';
import { imageUrl } from '../../utils/assetUrl';

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

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white';

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

export default function BrandEditPage({ brand, onNavigate }) {
  const [name, setName] = useState(brand?.name || '');
  const [logo, setLogo] = useState(brand?.logo || '');
  const [imageName, setImageName] = useState('No file chosen');
  const [metaTitle, setMetaTitle] = useState(brand?.metaTitle || '');
  const [metaDesc, setMetaDesc] = useState(brand?.metaDescription || '');
  const [metaKeyword, setMetaKeyword] = useState(brand?.metaKeyword || '');
  const [status, setStatus] = useState(brand?.status === 'Active' || brand?.status === 'active');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await brandService.update(brand.Id, { name: name.trim(), logo: logo || null, status: status ? 'Active' : 'Inactive' });
      onNavigate && onNavigate('brands');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Brand Edit</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('brands')} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            Manage
          </button>
        </div>
      </div>

      <div className="max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className={`${inputCls} ${error ? 'border-red-400' : ''}`} />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <label className="flex items-center border border-gray-300 rounded overflow-hidden cursor-pointer w-full">
            <span className="bg-white border-r border-gray-300 px-3 py-2 text-xs text-gray-600 whitespace-nowrap hover:bg-gray-50 transition">Choose file</span>
            <span className="px-3 text-xs text-gray-400 flex-1 truncate">{imageName}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files[0];
                if (f) {
                  setImageName(f.name);
                  setLogo(await readImageFile(f));
                }
              }}
            />
          </label>
          {logo && (
            <img src={imageUrl(logo)} alt={name || brand?.name} className="w-16 h-16 rounded-lg object-contain mt-2 border border-gray-200 bg-white p-2" />
          )}
        </div>

        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title (Optional)</label>
          <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} />
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (Optional)</label>
          <textarea rows={4} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className={`${inputCls} resize-y`} />
        </div>

        {/* Meta Keyword */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keyword (Optional)</label>
          <textarea rows={2} value={metaKeyword} onChange={(e) => setMetaKeyword(e.target.value)} className={`${inputCls} resize-y`} />
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
