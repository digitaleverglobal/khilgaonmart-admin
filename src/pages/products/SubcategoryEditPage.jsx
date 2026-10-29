import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { subcategoryService } from '../../services/productService';
import { useCategories } from '../../hooks/useProducts';
import ImageUploadField from '../../components/ImageUploadField';

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

export default function SubcategoryEditPage({ subcategory, onNavigate }) {
  const [name, setName] = useState(subcategory?.name || '');
  const [categoryId, setCategoryId] = useState(subcategory?.categoryId || '');
  const [image, setImage] = useState(subcategory?.image || '');
  const [status, setStatus] = useState(subcategory?.status === 'Active' || subcategory?.status === 'active');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: categories } = useCategories({ limit: 200 });

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await subcategoryService.update(subcategory.Id, { name: name.trim(), categoryId: categoryId || null, image: image || null, status: status ? 'Active' : 'Inactive' });
      onNavigate && onNavigate('subcategories');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Subategory Edit</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('subcategories')} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            Manage
          </button>
        </div>
      </div>

      <div className="max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="">Choose ...</option>
              {categories.map((c) => <option key={c.Id} value={c.Id}>{c.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className={`${inputCls} ${error ? 'border-red-400' : ''}`} />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <ImageUploadField value={image} onChange={setImage} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title (Optional)</label>
          <input type="text" defaultValue={subcategory?.metaTitle || ''} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (Optional)</label>
          <textarea rows={5} defaultValue={subcategory?.metaDescription || ''} className={`${inputCls} resize-y`} />
        </div>

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
