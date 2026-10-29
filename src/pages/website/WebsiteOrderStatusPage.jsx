import { useState, useEffect, useCallback } from 'react';
import { Pencil, X, Info } from 'lucide-react';
import { orderStatusService } from '../../services/websiteService';

export default function WebsiteOrderStatusPage({ onEdit, onCreate }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fetchStatuses = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await orderStatusService.getAll({ limit: 100 });
      setStatuses(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  async function handleDelete(s) {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    try {
      await orderStatusService.delete(s.Id);
      fetchStatuses();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-gray-800">Order Status Manage</h1>
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

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
        {!loading && error && <div className="text-center py-10 text-red-400 text-sm">{error}</div>}
        {!loading && !error && (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-gray-500 font-semibold w-24">SL</th>
                <th className="px-6 py-3 text-left text-gray-500 font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-gray-500 font-semibold w-48">Status</th>
                <th className="px-6 py-3 text-left text-gray-500 font-semibold w-40">Action</th>
              </tr>
            </thead>
            <tbody>
              {statuses.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No records found</td></tr>
              )}
              {statuses.map((s, i) => (
                <tr key={s.Id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-blue-50/30' : 'bg-white'} hover:bg-gray-50/60 transition`}>
                  <td className="px-6 py-3.5 text-gray-500">{i + 1}</td>
                  <td className="px-6 py-3.5 text-gray-800">{s.name}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button type="button" title="Details"
                        className="w-7 h-7 rounded bg-gray-400 hover:bg-gray-500 text-white flex items-center justify-center transition">
                        <Info size={12} />
                      </button>
                      <button type="button" title="Edit" onClick={() => onEdit && onEdit(s)}
                        className="w-7 h-7 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition">
                        <Pencil size={12} />
                      </button>
                      <button type="button" title="Delete" onClick={() => handleDelete(s)}
                        className="w-7 h-7 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition">
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
