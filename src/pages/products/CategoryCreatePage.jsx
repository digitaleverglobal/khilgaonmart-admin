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

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white';

import { categoryService } from '../../services/productService';

export default function CategoryCreatePage({ onNavigate }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState(true);
  const [frontView, setFrontView] = useState(false);
  const [imageFile, setImageFile] = useState('');
  const [imageName, setImageName] = useState('No file chosen');
  const [bannerFile, setBannerFile] = useState('');
  const [bannerName, setBannerName] = useState('No file chosen');
  const [sortOrder, setSortOrder] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function readFile(file, setter, nameSetter) {
    if (!file) {
      setter('');
      nameSetter('No file chosen');
      return;
    }
    nameSetter(file.name);
    const reader = new FileReader();
    reader.onload = () => setter(reader.result || '');
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await categoryService.create({
        name: name.trim(),
        status: status ? 'Active' : 'Inactive',
        isActive: frontView,
        frontView,
        imageFile: imageFile || null,
        image: imageFile || null,
        bannerImage: bannerFile || null,
        sortOrder: sortOrder === '' ? null : Number(sortOrder),
        metaTitle,
        metaDescription,
      });
      onNavigate && onNavigate('categories');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Category Create</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('categories')}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className={`${inputCls} ${error ? 'border-red-400' : ''}`} />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
          <label className="flex items-center border border-gray-300 rounded overflow-hidden cursor-pointer w-full">
            <span className="bg-white border-r border-gray-300 px-3 py-2 text-xs text-gray-600 whitespace-nowrap hover:bg-gray-50 transition">
              Choose file
            </span>
            <span className="px-3 text-xs text-gray-400 flex-1">{imageName}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => readFile(e.target.files[0], setImageFile, setImageName)}
            />
          </label>
          {imageFile && <img src={imageFile} alt={name || 'category'} className="mt-2 h-16 w-24 rounded-lg border border-gray-200 object-cover" />}
        </div>

        {/* Banner Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
          <label className="flex items-center border border-gray-300 rounded overflow-hidden cursor-pointer w-full">
            <span className="bg-white border-r border-gray-300 px-3 py-2 text-xs text-gray-600 whitespace-nowrap hover:bg-gray-50 transition">
              Choose file
            </span>
            <span className="px-3 text-xs text-gray-400 flex-1">{bannerName}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => readFile(e.target.files[0], setBannerFile, setBannerName)}
            />
          </label>
          {bannerFile && <img src={bannerFile} alt="category banner" className="mt-2 h-20 w-40 rounded-lg border border-gray-200 object-cover" />}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputCls} />
        </div>

        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title (Optional)</label>
          <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} />
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (Optional)</label>
          <textarea rows={5} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={`${inputCls} resize-y`} />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-16 pt-1">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <Toggle checked={status} onChange={setStatus} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Front View</span>
            <Toggle checked={frontView} onChange={setFrontView} />
          </div>
        </div>

        {/* Submit */}
        <div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
