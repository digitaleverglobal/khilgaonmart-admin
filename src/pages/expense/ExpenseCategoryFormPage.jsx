import { useState } from 'react';

export default function ExpenseCategoryFormPage({ mode = 'create', category, onSave, onNavigate }) {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    status: category?.status ?? true,
  });

  const isEdit = mode === 'edit';

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      id: category?.id,
      name: form.name.trim(),
      status: form.status,
    });
    onNavigate('expense_categories');
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Expense Category {isEdit ? 'Edit' : 'Create'}</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate('expense_categories')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Manage
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl rounded bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-semibold text-gray-500">Name *</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="mb-6 block">
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

          <button type="submit" className="rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
