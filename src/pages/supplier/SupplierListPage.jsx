import { useState } from 'react';
import { Eye, Pencil, CreditCard, Plus, Copy, Printer, FileText, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSuppliers } from '../../hooks/useSuppliers';
import { supplierService } from '../../services/supplierService';

const PAGE_SIZES = [10, 20, 50];

export default function SupplierListPage({ onNavigate, onEditSupplier, onPaymentSupplier, onViewSupplier }) {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: suppliers, meta, loading, error, refetch } = useSuppliers({
    searchTerm: searchTerm || undefined,
    page,
    limit: perPage,
  });

  const total = meta?.count ?? suppliers.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function handleSearch(e) {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  }

  async function handleDelete(id) {
    if (!window.confirm('এই supplier মুছে ফেলবেন?')) return;
    try {
      await supplierService.delete(id);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Supplier Manage</h1>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('supplier_add')}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {/* Toolbar */}
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Show</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-2 ml-2">
              {[['Copy', Copy], ['Print', Printer], ['PDF', FileText]].map(([label, Icon]) => (
                <button
                  key={label}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Search:</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400 w-40"
            />
            <button type="submit" className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">Go</button>
          </form>
        </div>

        {/* Table */}
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['SL', 'Name', 'Phone', 'Address', 'Total Paid', 'Total Unpaid', 'Net Balance', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-gray-500 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">Loading...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-red-400">{error}</td>
              </tr>
            )}
            {!loading && !error && suppliers.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">No data available in table</td>
              </tr>
            )}
            {!loading && suppliers.map((s, i) => (
              <tr key={s.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                <td className="px-4 py-3 text-gray-500">{(page - 1) * perPage + i + 1}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.phone || '-'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{s.address || s.note || '-'}</td>
                <td className="px-4 py-3 text-green-600 font-medium">{(s.totalPaid || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500 font-medium">{(s.totalUnpaid || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-700 font-semibold">{(s.netBalance || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold ${
                      s.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {s.status || 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onViewSupplier && onViewSupplier(s)}
                      className="w-7 h-7 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
                      title="View"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => onPaymentSupplier && onPaymentSupplier(s)}
                      className="w-7 h-7 rounded bg-green-500 text-white hover:bg-green-600 flex items-center justify-center"
                      title="Payment"
                    >
                      <CreditCard size={13} />
                    </button>
                    <button
                      onClick={() => onEditSupplier && onEditSupplier(s)}
                      className="w-7 h-7 rounded bg-teal-500 text-white hover:bg-teal-600 flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.Id)}
                      className="w-7 h-7 rounded bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
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

        {/* Footer / Pagination */}
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
              const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center ${
                    p === page ? 'bg-blue-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
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
