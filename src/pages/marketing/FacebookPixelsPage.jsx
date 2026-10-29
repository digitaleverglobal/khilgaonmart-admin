import { useState, useEffect, useCallback } from 'react';
import { Copy, FileText, Pencil, PlayCircle, Printer, ThumbsUp, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { facebookPixelService } from '../../services/marketingService';

export default function FacebookPixelsPage({ onCreate, onEdit }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({});
  const [sort, setSort]       = useState({ key: 'pixelsId', dir: 'asc' });
  const limit = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await facebookPixelService.getAll({ searchTerm: search || undefined, page, limit });
      setItems(res.data || []); setMeta(res.meta || {});
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleDelete(item) {
    if (!window.confirm('Delete this pixel?')) return;
    try { await facebookPixelService.delete(item.Id); fetchItems(); }
    catch (err) { alert(err.message); }
  }

  function toggleSort(key) {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  const sorted = [...items].sort((a, b) => {
    const va = a[sort.key] ?? '', vb = b[sort.key] ?? '';
    return sort.dir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
  });

  const totalPages = Math.max(1, Math.ceil((meta?.count ?? 0) / limit));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Pixels Manage</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
            <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={onCreate} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Create</button>
        </div>
      </div>

      <div className="rounded bg-white p-6 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded bg-slate-50">
            {[['Copy', Copy], ['Print', Printer], ['PDF', FileText]].map(([l, I]) => (
              <button key={l} type="button" className="inline-flex h-9 items-center gap-1.5 px-4 text-sm text-gray-700 transition hover:bg-slate-100"><I size={14} /> {l}</button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm text-gray-500">
            Search:
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 w-40 rounded border border-gray-300 px-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-100">
                <th className="px-4 py-4 text-left font-semibold text-gray-500 w-28">SL</th>
                <SortableHeader label="Pixels ID" sortKey="pixelsId" sort={sort} onSort={toggleSort} />
                <SortableHeader label="Status" sortKey="status" sort={sort} onSort={toggleSort} className="w-64" />
                <th className="px-4 py-4 text-left font-semibold text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>}
              {!loading && error && <tr><td colSpan={4} className="px-4 py-8 text-center text-red-400">{error}</td></tr>}
              {!loading && !error && sorted.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 bg-gray-50">No data available</td></tr>}
              {!loading && sorted.map((item, i) => (
                <tr key={item.Id} className="border-b border-gray-100 bg-gray-50 transition hover:bg-gray-100/70">
                  <td className="px-4 py-4 text-gray-600">{(page - 1) * limit + i + 1}</td>
                  <td className="px-4 py-4 text-gray-700">{item.pixelsId}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-500'}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button type="button" title="Details" className="flex h-7 w-8 items-center justify-center rounded bg-teal-500 text-white transition hover:bg-teal-600"><ThumbsUp size={13} /></button>
                      <button type="button" title="Edit" onClick={() => onEdit && onEdit(item)} className="flex h-7 w-8 items-center justify-center rounded bg-indigo-600 text-white transition hover:bg-indigo-700"><Pencil size={13} /></button>
                      <button type="button" title="Delete" onClick={() => handleDelete(item)} className="flex h-7 w-8 items-center justify-center rounded bg-rose-500 text-white transition hover:bg-rose-600"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between py-4 text-sm font-semibold text-gray-500">
          <span>Total {meta?.count ?? items.length} entries</span>
          <div className="flex items-center gap-2 text-slate-400">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="disabled:opacity-40 transition hover:text-indigo-600">‹</button>
            {items.length > 0 && <button className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">{page}</button>}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="disabled:opacity-40 transition hover:text-indigo-600">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort.key === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} className={`cursor-pointer px-4 py-4 text-left font-semibold text-gray-500 select-none ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="flex flex-col">
          <ChevronUp   size={10} className={active && sort.dir === 'asc'  ? 'text-indigo-500' : 'text-gray-300'} />
          <ChevronDown size={10} className={active && sort.dir === 'desc' ? 'text-indigo-500' : 'text-gray-300'} />
        </span>
      </div>
    </th>
  );
}
