import { useState } from 'react';
import {
  Bold,
  Code,
  Eraser,
  HelpCircle,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  Table,
  Underline,
  Video,
} from 'lucide-react';

export default function BlogFormPage({ mode = 'create', blog, onSave, onNavigate }) {
  const [form, setForm] = useState({
    title: blog?.title ?? '',
    imageName: blog?.imageName ?? '',
    imageText: blog?.imageText ?? '',
    imageColor: blog?.imageColor ?? 'linear-gradient(135deg, #1f2937, #60a5fa)',
    description: blog?.description ?? '',
    status: blog?.status ?? true,
  });

  const isEdit = mode === 'edit';

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      id: blog?.id,
      title: form.title.trim(),
      imageName: form.imageName,
      imageText: form.imageText.trim(),
      imageColor: form.imageColor,
      description: form.description,
      status: form.status,
    });
    onNavigate('blog');
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Blog {isEdit ? 'Edit' : 'Create'}</h1>
        <button
          type="button"
          onClick={() => onNavigate('blog')}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Manage
        </button>
      </div>

      <div className="mx-auto max-w-5xl rounded bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Title *">
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Image *">
            <input
              type="file"
              accept="image/*"
              required={!isEdit}
              onChange={(e) => {
                const fileName = e.target.files[0]?.name ?? '';
                setField('imageName', fileName);
                setField('imageText', fileName ? fileName.slice(0, 10) : form.imageText);
              }}
              className="h-9 w-full rounded border border-gray-300 bg-white text-sm text-gray-600 outline-none transition file:mr-4 file:h-full file:border-0 file:border-r file:border-gray-300 file:bg-gray-50 file:px-4 file:text-sm file:text-gray-600 hover:file:bg-gray-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </Field>

          <Field label="Description*">
            <RichTextEditor
              value={form.description}
              onChange={(value) => setField('description', value)}
            />
          </Field>

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

          <button type="submit" className="rounded bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function RichTextEditor({ value, onChange }) {
  return (
    <div className="overflow-hidden rounded border border-gray-300 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton icon={Eraser} />
        <ToolbarButton label="B" icon={Bold} />
        <ToolbarButton icon={Underline} />
        <ToolbarButton icon={Italic} />
        <select className="h-8 rounded border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none">
          <option>sans-serif</option>
          <option>serif</option>
          <option>monospace</option>
        </select>
        <button type="button" className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-yellow-100 text-sm font-bold text-black">
          A
        </button>
        <ToolbarButton icon={List} />
        <ToolbarButton icon={ListOrdered} />
        <ToolbarButton label="≡" />
        <ToolbarButton icon={Table} />
        <ToolbarButton icon={Link} />
        <ToolbarButton icon={Image} />
        <ToolbarButton icon={Video} />
        <ToolbarButton icon={Maximize2} />
        <ToolbarButton icon={Code} />
        <ToolbarButton icon={HelpCircle} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter Your Text Here"
        rows={3}
        className="w-full resize-y px-3 py-3 text-sm text-gray-700 outline-none"
      />
      <div className="h-2 border-t border-gray-200 bg-gray-50 text-center text-[10px] leading-none text-gray-300">═</div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label }) {
  return (
    <button type="button" className="flex h-8 min-w-8 items-center justify-center rounded border border-gray-300 bg-white px-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
      {Icon ? <Icon size={15} /> : label}
    </button>
  );
}
