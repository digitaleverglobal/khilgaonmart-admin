import { useMemo, useState } from 'react';
import { Copy, FileText, Pencil, Printer, ThumbsDown, ThumbsUp, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export default function BannerAdsPage({ banners, onCreate, onEdit, onDelete, onToggleStatus }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });

  function toggleSort(key) {
    setSort((prev) => (
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    ));
  }

  const filtered = useMemo(() => {
    return banners
      .filter((banner) => banner.isDynamic !== false)
      .filter((banner) => banner.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const va = sort.key === 'id' ? a.id : a[sort.key];
        const vb = sort.key === 'id' ? b.id : b[sort.key];
        if (va < vb) return sort.dir === 'asc' ? -1 : 1;
        if (va > vb) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [banners, search, sort]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Banner Manage</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={onCreate} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
            Create
          </button>
        </div>
      </div>

      <div className="rounded bg-white p-6 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded bg-slate-50">
            <ToolButton icon={Copy} label="Copy" />
            <ToolButton icon={Printer} label="Print" />
            <ToolButton icon={FileText} label="PDF" />
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-500">
            Search:
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-40 rounded border border-gray-300 px-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-100">
                <SortableHeader label="SL" sortKey="id" sort={sort} onSort={toggleSort} className="w-28" />
                <SortableHeader label="Category" sortKey="category" sort={sort} onSort={toggleSort} />
                <SortableHeader label="Image" sortKey="imageText" sort={sort} onSort={toggleSort} className="w-44" />
                <SortableHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} className="w-48" />
                <th className="px-4 py-4 text-left font-semibold text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((banner, index) => (
                <tr key={banner.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 transition hover:bg-gray-100/70`}>
                  <td className="px-4 py-4 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-4 text-gray-700">{banner.category}</td>
                  <td className="px-4 py-4">
                    {banner.imageSrc ? (
                      <img
                        src={banner.imageSrc}
                        alt={banner.imageText || banner.category}
                        className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-gray-200 text-center text-[8px] font-bold leading-tight text-white"
                        style={{ background: banner.imageColor }}
                      >
                        {banner.imageText}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                      banner.status ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                    }`}
                    >
                      {banner.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        title={banner.status ? 'Disable' : 'Enable'}
                        onClick={() => onToggleStatus?.(banner)}
                        className={`flex h-7 w-8 items-center justify-center rounded text-white transition ${
                          banner.status ? 'bg-gray-600 hover:bg-gray-700' : 'bg-teal-500 hover:bg-teal-600'
                        }`}
                      >
                        {banner.status ? <ThumbsDown size={13} /> : <ThumbsUp size={13} />}
                      </button>
                      <button type="button" title="Edit" onClick={() => onEdit(banner)} className="flex h-7 w-8 items-center justify-center rounded bg-indigo-600 text-white transition hover:bg-indigo-700">
                        <Pencil size={13} />
                      </button>
                      <button type="button" title="Delete" onClick={() => onDelete(banner.id)} className="flex h-7 w-8 items-center justify-center rounded bg-rose-500 text-white transition hover:bg-rose-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between py-4 text-sm font-semibold text-gray-500">
          <span>Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries</span>
          <div className="flex items-center gap-5 text-slate-400">
            <button type="button" className="transition hover:text-indigo-600">‹</button>
            {filtered.length > 0 && (
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">1</button>
            )}
            <button type="button" className="transition hover:text-indigo-600">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, label }) {
  return (
    <button type="button" className="inline-flex h-9 items-center gap-1.5 px-4 text-sm text-gray-700 transition hover:bg-slate-100">
      <Icon size={14} />
      {label}
    </button>
  );
}

function SortableHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort.key === sortKey;

  return (
    <th onClick={() => onSort(sortKey)} className={`cursor-pointer px-4 py-4 text-left font-semibold text-gray-500 select-none ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="flex flex-col">
          <ChevronUp size={10} className={active && sort.dir === 'asc' ? 'text-indigo-500' : 'text-gray-300'} />
          <ChevronDown size={10} className={active && sort.dir === 'desc' ? 'text-indigo-500' : 'text-gray-300'} />
        </span>
      </div>
    </th>
  );
}
