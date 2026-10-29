import { useState, useRef, useEffect } from 'react';
import {
  Bold, Underline, Italic, AlignLeft, List, ListOrdered,
  Link, Image, Film, Maximize2, Code, HelpCircle,
} from 'lucide-react';
import { websitePageService } from '../../services/websiteService';

function ToolbarBtn({ icon, cmd }) {
  function handle() { if (cmd) document.execCommand(cmd, false, null); }
  return (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); handle(); }}
      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 transition">
      {icon}
    </button>
  );
}
function Sep() { return <div className="w-px h-4 bg-gray-200 mx-0.5" />; }

function RichEditor({ html, onChange }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html || ''; }, []);
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <ToolbarBtn icon={<span className="text-xs font-bold">⚙</span>} /><Sep />
        <ToolbarBtn icon={<Bold size={12} />}      cmd="bold" />
        <ToolbarBtn icon={<Underline size={12} />} cmd="underline" />
        <ToolbarBtn icon={<Italic size={12} />}    cmd="italic" />
        <ToolbarBtn icon={<span className="text-xs font-bold">S̶</span>} cmd="strikeThrough" /><Sep />
        <select className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600 focus:outline-none"
          onChange={(e) => document.execCommand('fontName', false, e.target.value)}>
          <option>sans-serif</option><option>serif</option><option>monospace</option>
        </select><Sep />
        <ToolbarBtn icon={<List size={12} />}        cmd="insertUnorderedList" />
        <ToolbarBtn icon={<ListOrdered size={12} />} cmd="insertOrderedList" />
        <ToolbarBtn icon={<AlignLeft size={12} />}   cmd="justifyLeft" /><Sep />
        <ToolbarBtn icon={<span className="text-xs">⊞</span>} /><Sep />
        <ToolbarBtn icon={<Link size={12} />} /><ToolbarBtn icon={<Image size={12} />} /><ToolbarBtn icon={<Film size={12} />} /><Sep />
        <ToolbarBtn icon={<Maximize2 size={12} />} /><ToolbarBtn icon={<Code size={12} />} /><ToolbarBtn icon={<HelpCircle size={12} />} />
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => onChange && onChange(ref.current.innerHTML)}
        className="min-h-[420px] px-4 py-3 text-sm text-gray-800 focus:outline-none overflow-y-auto"
        style={{ lineHeight: '1.6' }} />
    </div>
  );
}

export default function WebsitePageEditPage({ page, onSave, onNavigate }) {
  const isEdit = Boolean(page?.Id);

  const [form, setForm] = useState({
    name:        page?.name        ?? '',
    title:       page?.title       ?? '',
    description: page?.description ?? '',
    status:      page?.status      ?? 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await websitePageService.update(page.Id, form);
      } else {
        await websitePageService.create(form);
      }
      onSave && onSave();
      onNavigate && onNavigate('create_page');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-bold text-gray-800">{isEdit ? 'Page Edit' : 'Page Create'}</h1>
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('create_page')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
            Manage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <RichEditor html={form.description} onChange={(v) => set('description', v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <button type="button" onClick={() => set('status', form.status === 'Active' ? 'Inactive' : 'Active')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${form.status === 'Active' ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${form.status === 'Active' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
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
