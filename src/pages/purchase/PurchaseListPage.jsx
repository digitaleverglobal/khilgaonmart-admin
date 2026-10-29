import { useState } from 'react';
import { Eye, Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePurchases } from '../../hooks/usePurchase';
import { useSupplierAllList } from '../../hooks/useSuppliers';
import { purchaseService } from '../../services/purchaseService';

const PAGE_SIZES = [10, 20, 50];

const STATUS_COLORS = {
  Approved: 'bg-green-100 text-green-700',
  Pending:  'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100 text-red-600',
};

export default function PurchaseListPage({ onNavigate, onEditPurchase }) {
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: suppliers } = useSupplierAllList();
  const { data: purchases, meta, loading, error, refetch } = usePurchases({
    searchTerm: appliedKeyword || undefined,
    supplierId: appliedFilters.supplierId || undefined,
    startDate: appliedFilters.startDate || undefined,
    endDate: appliedFilters.endDate || undefined,
    page,
    limit: perPage,
  });

  const total = meta?.count ?? purchases.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function handleSubmit(e) {
    e.preventDefault();
    setAppliedKeyword(keyword);
    setAppliedFilters({
      supplierId: filterSupplierId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setPage(1);
  }

  function handleReset() {
    setKeyword('');
    setAppliedKeyword('');
    setFilterSupplierId('');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({});
    setPage(1);
  }

  async function handleDelete(id) {
    if (!window.confirm('এই purchase মুছে ফেলবেন?')) return;
    try {
      await purchaseService.delete(id);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Purchase List</h1>
        <button
          onClick={() => onNavigate && onNavigate('purchase_add')}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">Keyword</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-44"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">Supplier</span>
          <select
            value={filterSupplierId}
            onChange={(e) => setFilterSupplierId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-400 bg-white w-44"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.Id} value={s.Id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">Start Date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">End Date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-36" />
        </div>
        <div className="flex gap-2 self-end">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-lg transition">Submit</button>
          <button type="button" onClick={handleReset} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-5 py-2 rounded-lg transition">Reset</button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <span className="text-xs text-gray-500">Show</span>
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <table className="w-full min-w-[760px] text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['SL', 'Name', 'Date', 'Supplier', 'Amount', 'Qty', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>}
            {!loading && error && <tr><td colSpan={8} className="text-center py-10 text-red-400">{error}</td></tr>}
            {!loading && !error && purchases.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No data available</td></tr>
            )}
            {!loading && purchases.map((p, i) => (
              <tr key={p.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                <td className="px-4 py-3 text-gray-500">{(page - 1) * perPage + i + 1}</td>
                <td className="px-4 py-3 font-semibold text-gray-700 max-w-[180px] truncate">{p.name}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.date || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{p.supplier?.name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-700">{(p.amount || 0).toLocaleString()} ৳</td>
                <td className="px-4 py-3 text-gray-600">{p.quantity ?? '-'}</td>
                <td className="px-4 py-3">
                  {p.status ? (
                    <span className={`px-2.5 py-1 rounded text-[10px] font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  ) : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditPurchase && onEditPurchase(p)}
                      className="w-7 h-7 rounded-full border-2 border-green-400 text-green-500 hover:bg-green-50 flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.Id)}
                      className="w-7 h-7 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-50 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} entries
          </span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="w-7 h-7 rounded border border-gray-300 text-gray-400 hover:bg-gray-50 flex items-center justify-center text-xs disabled:opacity-40">
              <ChevronLeft size={12} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center ${pg === page ? 'bg-purple-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  {pg}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="w-7 h-7 rounded border border-gray-300 text-gray-400 hover:bg-gray-50 flex items-center justify-center text-xs disabled:opacity-40">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
