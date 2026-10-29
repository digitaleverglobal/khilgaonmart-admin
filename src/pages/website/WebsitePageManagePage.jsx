import { useState, useEffect, useCallback } from 'react';
import { Copy, Printer, FileText, Pencil, X, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { websitePageService } from '../../services/websiteService';

export default function WebsitePageManagePage({ onEdit, onCreate }) {
  const [pages, setPages]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({});
  const [sort, setSort]       = useState({ key: 'name', dir: 'asc' });
  const limit = 20;

  const fetchPages = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await websitePageService.getAll({ searchTerm: search || undefined, page, limit });
      setPages(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await websitePageService.delete(p.Id);
      fetchPages();
    } catch (err) {
      alert(err.message);
    }
  }

  function toggleSort(key) {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  const sorted = [...pages].sort((a, b) => {
    const va = a[sort.key] ?? '';
    const vb = b[sort.key] ?? '';
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ?  1 : -1;
    return 0;
  });

  const totalPages = meta?.totalPage ?? Math.max(1, Math.ceil((meta?.count ?? 0) / limit));

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-gray-800">Page Manage</h1>
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
            ▶ টিউটোরিয়াল দেখুন
          </button>
          <button type="button" onClick={onCreate}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
            Create
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100">
          <div className="flex gap-2">
            {[['Copy', Copy], ['Print', Printer], ['PDF', FileText]].map(([label, Icon]) => (
              <button key={label} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Search:</span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 w-44" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[{ key: null, label: 'SL' }, { key: 'name', label: 'Name' }, { key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }, { key: null, label: 'Action' }]
                  .map(({ key, label }) => (
                    <th key={label} onClick={key ? () => toggleSort(key) : undefined}
                      className={`px-4 py-3 text-left text-gray-500 font-semibold select-none ${key ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                      <div className="flex items-center gap-1">
                        {label}
                        {key && (
                          <span className="flex flex-col">
                            <ChevronUp   size={9} className={sort.key === key && sort.dir === 'asc'  ? 'text-blue-500' : 'text-gray-300'} />
                            <ChevronDown size={9} className={sort.key === key && sort.dir === 'desc' ? 'text-blue-500' : 'text-gray-300'} />
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {!loading && error && <tr><td colSpan={5} className="text-center py-10 text-red-400">{error}</td></tr>}
              {!loading && !error && sorted.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No pages found</td></tr>
              )}
              {!loading && sorted.map((p, i) => (
                <tr key={p.Id} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + i + 1}</td>
                  <td className="px-4 py-3 text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.title || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button type="button" title="Details"
                        className="w-7 h-7 rounded bg-gray-400 hover:bg-gray-500 text-white flex items-center justify-center transition">
                        <Info size={12} />
                      </button>
                      <button type="button" title="Edit" onClick={() => onEdit && onEdit(p)}
                        className="w-7 h-7 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition">
                        <Pencil size={12} />
                      </button>
                      <button type="button" title="Delete" onClick={() => handleDelete(p)}
                        className="w-7 h-7 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition">
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-500">Total {meta?.count ?? pages.length} entries</span>
          <div className="flex gap-1">
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} label="‹" />
            <button className="w-7 h-7 rounded bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">{page}</button>
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} label="›" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ onClick, disabled, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-xs transition ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}>
      {label}
    </button>
  );
}
