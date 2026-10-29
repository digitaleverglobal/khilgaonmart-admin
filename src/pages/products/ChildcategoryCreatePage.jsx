import { useState } from 'react';
import { ChevronDown, Bold, Underline, Strikethrough, List, AlignLeft, Link, Image as ImageIcon, Maximize2, Code, HelpCircle } from 'lucide-react';
import { childcategoryService } from '../../services/productService';
import { useSubcategories } from '../../hooks/useProducts';
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

function ToolbarBtn({ children }) {
  return (
    <button type="button" className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 transition text-xs">
      {children}
    </button>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-400 bg-white';

export default function ChildcategoryCreatePage({ onNavigate }) {
  const [name, setName] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: subcategories } = useSubcategories({ limit: 200 });

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await childcategoryService.create({ name: name.trim(), subcategoryId: subcategoryId || null, image: image || null, status: status ? 'Active' : 'Inactive' });
      onNavigate && onNavigate('childcategories');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Childcategory Create</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={() => onNavigate && onNavigate('childcategories')} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            Manage
          </button>
        </div>
      </div>

      <div className="max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Sub Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
          <div className="relative">
            <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="">Choose ...</option>
              {subcategories.map((s) => <option key={s.Id} value={s.Id}>{s.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Childcategory Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Childcategory Name *</label>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className={`${inputCls} ${error ? 'border-red-400' : ''}`} />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <ImageUploadField value={image} onChange={setImage} />

        {/* Meta Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title (Optional)</label>
          <input type="text" className={inputCls} />
        </div>

        {/* Meta Description with Rich Text Toolbar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (Optional)</label>
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
              <ToolbarBtn><span className="text-xs">↩</span></ToolbarBtn>
              <div className="w-px h-4 bg-gray-300 mx-0.5" />
              <ToolbarBtn><Bold size={13} /></ToolbarBtn>
              <ToolbarBtn><Underline size={13} /></ToolbarBtn>
              <ToolbarBtn><Strikethrough size={13} /></ToolbarBtn>
              <div className="flex items-center border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-600 bg-white gap-1 mx-0.5">
                sans-serif <ChevronDown size={10} />
              </div>
              <div className="flex items-center gap-0.5 mx-0.5">
                <ToolbarBtn><span className="text-yellow-500 font-bold text-sm">A</span></ToolbarBtn>
                <ToolbarBtn><ChevronDown size={10} /></ToolbarBtn>
              </div>
              <div className="w-px h-4 bg-gray-300 mx-0.5" />
              <ToolbarBtn><List size={13} /></ToolbarBtn>
              <ToolbarBtn><span className="text-xs font-mono">1.</span></ToolbarBtn>
              <div className="flex items-center border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white gap-1 mx-0.5">
                <AlignLeft size={12} /><ChevronDown size={10} />
              </div>
              <div className="flex items-center border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white gap-1 mx-0.5">
                <span className="text-xs">⊞</span><ChevronDown size={10} />
              </div>
              <div className="w-px h-4 bg-gray-300 mx-0.5" />
              <ToolbarBtn><Link size={13} /></ToolbarBtn>
              <ToolbarBtn><ImageIcon size={13} /></ToolbarBtn>
              <ToolbarBtn><span className="text-xs">▶</span></ToolbarBtn>
              <ToolbarBtn><Maximize2 size={12} /></ToolbarBtn>
              <ToolbarBtn><Code size={13} /></ToolbarBtn>
              <ToolbarBtn><HelpCircle size={13} /></ToolbarBtn>
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Enter Your Text Here"
              className="min-h-[80px] px-3 py-2 text-sm text-gray-400 focus:outline-none focus:text-gray-800"
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
