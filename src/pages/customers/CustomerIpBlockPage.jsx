import { useState, useEffect, useCallback } from 'react';
import { Copy, Printer, FileText, Pencil, X, ChevronUp, ChevronDown } from 'lucide-react';
import { ipBlockService } from '../../services/websiteService';

export default function CustomerIpBlockPage() {
  const [blocks, setBlocks]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [meta, setMeta]         = useState({});
  const [sort, setSort]         = useState({ key: 'createdAt', dir: 'desc' });
  const [form, setForm]         = useState({ ip: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const limit = 20;

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ipBlockService.getAll({ searchTerm: search || undefined, page, limit });
      setBlocks(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  function setF(f, v) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.ip.trim()) return;
    setSubmitting(true);
    try {
      await ipBlockService.create({ ip: form.ip.trim(), reason: form.reason.trim() });
      setForm({ ip: '', reason: '' });
      fetchBlocks();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await ipBlockService.update(editTarget.Id, { ip: editTarget.ip, reason: editTarget.reason });
      setEditTarget(null);
      fetchBlocks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(b) {
    if (!window.confirm('Delete this IP block?')) return;
    try {
      await ipBlockService.delete(b.Id);
      fetchBlocks();
    } catch (err) {
      alert(err.message);
    }
  }

  function toggleSort(key) {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  const sorted = [...blocks].sort((a, b) => {
    const va = a[sort.key] ?? '';
    const vb = b[sort.key] ?? '';
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ?  1 : -1;
    return 0;
  });

  const totalPages = meta?.totalPage ?? Math.max(1, Math.ceil((meta?.count ?? 0) / limit));

  function formatExpiresAt(value) {
    if (!value) return 'Permanent';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
      <h1 className="text-lg font-bold text-gray-800">IP Block Manage</h1>

      {/* Add form */}
      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IP No <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.ip} onChange={(e) => setF('ip', e.target.value)} required
              placeholder="e.g. 103.124.226.105"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea value={form.reason} onChange={(e) => setF('reason', e.target.value)} rows={3}
              placeholder="Enter reason for blocking..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </div>
          <button type="submit" disabled={submitting}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
            {submitting ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>

      {/* Table */}
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
                {[{ key: null, label: 'SL' }, { key: 'ip', label: 'IP' }, { key: 'reason', label: 'Reason' }, { key: 'expiresAt', label: 'Expires' }, { key: null, label: 'Action' }]
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
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No blocked IPs found</td></tr>
              )}
              {!loading && sorted.map((b, i) => (
                <tr key={b.Id} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-gray-800">{b.ip}</td>
                  <td className="px-4 py-3 text-gray-600">{b.reason || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatExpiresAt(b.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button type="button" title="Edit" onClick={() => setEditTarget({ ...b })}
                        className="w-7 h-7 rounded bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center transition">
                        <Pencil size={12} />
                      </button>
                      <button type="button" title="Delete" onClick={() => handleDelete(b)}
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
          <span className="text-xs text-gray-500">Total {meta?.count ?? blocks.length} entries</span>
          <div className="flex gap-1">
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} label="‹" />
            <button className="w-7 h-7 rounded bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">{page}</button>
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} label="›" />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Edit IP Address</h2>
              <button type="button" onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP No <span className="text-red-500">*</span></label>
                <input type="text" value={editTarget.ip} required
                  onChange={(e) => setEditTarget((p) => ({ ...p, ip: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={editTarget.reason || ''} rows={3}
                  onChange={(e) => setEditTarget((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              </div>
              <button type="submit"
                className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
                Update
              </button>
            </form>
          </div>
        </div>
      )}
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
