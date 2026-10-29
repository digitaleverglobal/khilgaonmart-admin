import { useState } from 'react';

export default function BannerAdsFormPage({ mode = 'create', banner, categories, onSave, onNavigate }) {
  const initialCategoryId = banner?.categoryId ?? categories.find((item) => item.name === banner?.category)?.id ?? '';
  const [form, setForm] = useState({
    link: banner?.link ?? '',
    categoryId: initialCategoryId,
    imageName: banner?.imageName ?? '',
    imageFile: null,
    imageText: banner?.imageText ?? '',
    imageColor: banner?.imageColor ?? 'linear-gradient(135deg, #94a3b8, #475569)',
    status: banner?.status ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = mode === 'edit';

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const selectedCategory = categories.find((category) => String(category.id) === String(form.categoryId));
    setError('');
    setSaving(true);
    try {
      await onSave({
        id: banner?.id,
        link: form.link.trim(),
        categoryId: form.categoryId,
        category: selectedCategory?.name ?? '',
        imageName: form.imageName,
        imageFile: form.imageFile,
        imageText: form.imageText,
        imageColor: form.imageColor,
        status: form.status,
        sortOrder: banner?.sortOrder ?? null,
      });
      onNavigate('banner_ads');
    } catch (err) {
      setError(err.message || 'Banner save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Banner {isEdit ? 'Edit' : 'Create'}</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate('banner_ads')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Manage
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl rounded bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">link *</span>
            <input
              type="text"
              required
              value={form.link}
              onChange={(e) => setField('link', e.target.value)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">Banner Category</span>
            <select
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Choose ...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">Image *</span>
            <input
              type="file"
              accept="image/*"
              required={!isEdit}
              onChange={(e) => {
                const file = e.target.files[0] ?? null;
                const fileName = file?.name ?? '';
                setField('imageFile', file);
                setField('imageName', fileName);
                setField('imageText', fileName ? fileName.slice(0, 10) : form.imageText);
              }}
              className="h-9 w-full rounded border border-gray-300 bg-white text-sm text-gray-600 outline-none transition file:mr-4 file:h-full file:border-0 file:border-r file:border-gray-300 file:bg-gray-50 file:px-4 file:text-sm file:text-gray-600 hover:file:bg-gray-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">Status</span>
            <button
              type="button"
              onClick={() => setField('status', !form.status)}
              className={`relative inline-flex h-8 w-[58px] items-center rounded-full transition-colors duration-200 focus:outline-none ${
                form.status ? 'bg-sky-500' : 'bg-gray-300'
              }`}
              aria-pressed={form.status}
            >
              <span
                className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${
                  form.status ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <button type="submit" disabled={saving} className="rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
