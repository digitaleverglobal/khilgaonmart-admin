import { useCallback, useEffect, useState } from 'react';
import { Copy, Printer, FileText, Pencil, Eye, Trash2, ShieldOff, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { customerService } from '../../services/customerService';

const PAGE_SIZE = 20;

export default function CustomerListPage({ onViewCustomer, onEditCustomer }) {
  const [search, setSearch]       = useState('');
  const [query, setQuery]         = useState({ search: '', page: 1, limit: PAGE_SIZE });
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta]           = useState({ count: 0, totalPage: 1 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [busyId, setBusyId]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customerService.list(query);
      setCustomers(res.data || []);
      setMeta(res.meta || { count: 0, totalPage: 1 });
    } catch (err) {
      setError(err.message || 'Customers load করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  function applySearch() {
    if (search === query.search) return;
    setQuery((q) => ({ ...q, search, page: 1 }));
  }

  async function handleDelete(c) {
    if (!window.confirm(`Customer "${c.customerCode} · ${c.name || c.phone}" মুছে ফেলবেন?\nতার অর্ডারগুলো থাকবে।`)) return;
    setBusyId(c.Id);
    try {
      await customerService.delete(c.Id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleBlock(c) {
    const blocked = c.status === 'Blocked';
    if (!blocked && !window.confirm(`${c.phone} নাম্বার থেকে ওয়েবসাইটে অর্ডার বন্ধ করবেন?`)) return;
    setBusyId(c.Id);
    try {
      await customerService.update(c.Id, { status: blocked ? 'Active' : 'Blocked' });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const page = query.page;
  const totalPages = Math.max(1, meta?.totalPage ?? Math.ceil((meta?.count ?? 0) / PAGE_SIZE));

  function goPage(p) {
    setQuery((q) => ({ ...q, page: Math.max(1, Math.min(totalPages, p)) }));
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Customer List</h1>
        <button type="button"
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition">
          ▶ টিউটোরিয়াল দেখুন
        </button>
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
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              onBlur={applySearch}
              placeholder="নাম / ফোন / C-0001"
              className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 w-44"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['SL', 'Customer ID', 'Customer Name', 'Phone', 'Area', 'Orders', 'Points', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={8} className="text-center py-10 text-red-400">{error}</td></tr>
              )}
              {!loading && !error && customers.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No data available in table</td></tr>
              )}
              {!loading && !error && customers.map((c, i) => {
                const blocked = c.status === 'Blocked';
                return (
                  <tr key={c.Id} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-600">{c.customerCode}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {c.name || '—'}
                      {blocked && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">Blocked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{[c.address, c.district].filter(Boolean).join(', ')}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.orderCount}
                      <span className="ml-1 text-gray-400">· ৳{Number(c.totalSpent || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-orange-500">{c.rewardPoints || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ActionBtn icon={blocked ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                          title={blocked ? 'Unblock' : 'Block'}
                          color={blocked ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-500 hover:bg-gray-600'}
                          disabled={busyId === c.Id}
                          onClick={() => handleBlock(c)} />
                        <ActionBtn icon={<Pencil size={12} />} title="Edit"
                          color="bg-indigo-500 hover:bg-indigo-600"
                          onClick={() => onEditCustomer && onEditCustomer(c)} />
                        <ActionBtn icon={<Eye size={12} />} title="View"
                          color="bg-teal-500 hover:bg-teal-600"
                          onClick={() => onViewCustomer && onViewCustomer(c)} />
                        <ActionBtn icon={<Trash2 size={12} />} title="Delete"
                          color="bg-pink-500 hover:bg-pink-600"
                          disabled={busyId === c.Id}
                          onClick={() => handleDelete(c)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Total {meta?.count ?? customers.length} customers
          </span>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => goPage(1)} disabled={page === 1} label="«" />
            <PagBtn onClick={() => goPage(page - 1)} disabled={page === 1} label={<ChevronLeft size={12} />} />
            <span className="w-16 text-center text-xs text-gray-600">
              {page} / {totalPages}
            </span>
            <PagBtn onClick={() => goPage(page + 1)} disabled={page >= totalPages} label={<ChevronRight size={12} />} />
            <PagBtn onClick={() => goPage(totalPages)} disabled={page >= totalPages} label="»" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, color, onClick, disabled = false }) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      className={`w-7 h-7 rounded text-white flex items-center justify-center transition disabled:opacity-50 ${color}`}>
      {icon}
    </button>
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
