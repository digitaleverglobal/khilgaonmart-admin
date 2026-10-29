import { useState } from 'react';
import { Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSupplierHistory, useSupplierAllList } from '../../hooks/useSuppliers';
import { supplierHistoryService } from '../../services/supplierService';

const PAGE_SIZES = [10, 20, 50];

export default function PaymentListPage({ onNavigate, onEditPayment }) {
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: suppliers } = useSupplierAllList();
  const { data: payments, meta, loading, error, refetch } = useSupplierHistory({
    ...appliedFilters,
    page,
    limit: perPage,
  });

  const total = meta?.total ?? payments.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function handleSubmit(e) {
    e.preventDefault();
    const filters = {};
    if (filterSupplierId) filters.supplierId = filterSupplierId;
    if (filterStatus) filters.status = filterStatus;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    setAppliedFilters(filters);
    setPage(1);
  }

  function handleReset() {
    setFilterSupplierId('');
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({});
    setPage(1);
  }

  async function handleDelete(id) {
    if (!window.confirm('এই payment মুছে ফেলবেন?')) return;
    try {
      await supplierHistoryService.delete(id);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Payment Manage</h1>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate && onNavigate('payment_add')}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {meta && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Paid', value: meta.totalPaid || 0, color: 'text-green-600 bg-green-50 border-green-200' },
            { label: 'Total Unpaid', value: meta.totalUnpaid || 0, color: 'text-red-500 bg-red-50 border-red-200' },
            { label: 'Net Balance', value: meta.netBalance || 0, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
              <p className="text-[11px] font-medium opacity-70">{label}</p>
              <p className="text-lg font-bold">{value.toLocaleString()} ৳</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow px-4 py-3 flex flex-wrap items-center gap-3"
      >
        <select
          value={filterSupplierId}
          onChange={(e) => setFilterSupplierId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-400 bg-white min-w-[180px]"
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.Id} value={s.Id}>{s.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-400 bg-white"
        >
          <option value="">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 focus:outline-none focus:border-blue-400 flex-1 min-w-[140px]"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 focus:outline-none focus:border-blue-400 flex-1 min-w-[140px]"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-lg transition"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-5 py-2 rounded-lg transition"
        >
          Reset
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <span className="text-xs text-gray-500">Show</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                'SL',
                'Date',
                'Title',
                'Supplier',
                'Amount',
                'Due',
                'Method',
                'Status',
                'Sender',
                'Transaction ID',
                'Description',
                'File',
                'Action',
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={13} className="text-center py-10 text-gray-400">Loading...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={13} className="text-center py-10 text-red-400">{error}</td>
              </tr>
            )}
            {!loading && !error && payments.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-10 text-gray-400">No data available</td>
              </tr>
            )}
            {!loading && payments.map((p, i) => (
              <tr key={p.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                <td className="px-4 py-3 text-gray-500">{(page - 1) * perPage + i + 1}</td>
                <td className="px-4 py-3 text-gray-600">{p.date}</td>
                <td className="px-4 py-3 text-gray-700 font-medium min-w-[160px]">{p.paymentTitle || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{p.supplier?.name ?? '-'}</td>
                <td className="px-4 py-3 text-gray-700 font-medium">৳{(p.amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">৳{(p.due || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.method || '-'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold ${
                      p.status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.sender || '-'}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.transactionId || '-'}</td>
                <td className="px-4 py-3 text-gray-600 min-w-[180px] max-w-[260px] truncate" title={p.description || ''}>
                  {p.description || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.file || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditPayment && onEditPayment(p)}
                      className="w-7 h-7 rounded bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.Id)}
                      className="w-7 h-7 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center"
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
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Showing {total === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} entries
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-7 h-7 rounded border border-gray-300 text-gray-400 hover:bg-gray-50 flex items-center justify-center text-xs disabled:opacity-40"
            >
              <ChevronLeft size={12} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center ${
                    pg === page ? 'bg-blue-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-7 h-7 rounded border border-gray-300 text-gray-400 hover:bg-gray-50 flex items-center justify-center text-xs disabled:opacity-40"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
