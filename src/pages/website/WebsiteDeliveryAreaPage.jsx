import { useState, useEffect, useCallback } from 'react';
import { Copy, Printer, FileText, Pencil, X } from 'lucide-react';
import { deliveryAreaService } from '../../services/websiteService';

export default function WebsiteDeliveryAreaPage({ onEdit, onCreate }) {
  const [areas, setAreas]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [meta, setMeta]       = useState({});
  const limit = 20;

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryAreaService.getAll({
        searchTerm: search || undefined,
        page,
        limit,
      });
      setAreas(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  async function handleDelete(a) {
    if (!window.confirm(`Delete "${a.area}" (${a.district})?`)) return;
    try {
      await deliveryAreaService.delete(a.Id);
      fetchAreas();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggle(a) {
    try {
      await deliveryAreaService.update(a.Id, { status: a.status === 'Active' ? 'Inactive' : 'Active' });
      fetchAreas();
    } catch (err) {
      alert(err.message);
    }
  }

  const totalPages = meta?.totalPage ?? Math.max(1, Math.ceil((meta?.count ?? 0) / limit));

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-gray-800">Delivery Area Manage</h1>
        <div className="flex gap-2">
          <button type="button"
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
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
              <button key={label}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Search:</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="District or area"
              className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 w-44"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['SL', 'District', 'Area', 'Delivery Charge', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {!loading && error && <tr><td colSpan={6} className="text-center py-10 text-red-400">{error}</td></tr>}
              {!loading && !error && areas.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No records found</td></tr>
              )}
              {!loading && areas.map((a, i) => (
                <tr key={a.Id} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="px-4 py-3 text-gray-500">{(page - 1) * limit + i + 1}</td>
                  <td className="px-4 py-3 text-gray-800">{a.district}</td>
                  <td className="px-4 py-3 text-gray-800">{a.area}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">৳{Number(a.charge ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => handleToggle(a)} title="Toggle status"
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        a.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                      {a.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button type="button" title="Edit" onClick={() => onEdit && onEdit(a)}
                        className="w-7 h-7 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition">
                        <Pencil size={12} />
                      </button>
                      <button type="button" title="Delete" onClick={() => handleDelete(a)}
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
          <span className="text-xs text-gray-500">
            Total {meta?.count ?? areas.length} entries
          </span>
          <div className="flex gap-1">
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} label="‹" />
            <button className="w-7 h-7 rounded bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
              {page}
            </button>
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
      className={`w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-xs transition ${
        disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'
      }`}>
      {label}
    </button>
  );
}
