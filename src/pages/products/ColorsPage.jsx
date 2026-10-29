import { useState, useMemo } from 'react';
import { Edit2, Trash2, Copy, Printer, FileText, Search, ChevronLeft, ChevronRight, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useColors } from '../../hooks/useProducts';
import { colorService } from '../../services/productService';

const PER_PAGE = 20;

function isDark(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export default function ColorsPage({ onNavigate, onEditColor }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const { data: allColors, meta, loading, error, refetch } = useColors({ limit: 500 });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? allColors.filter((c) => c.name.toLowerCase().includes(q)) : allColors;
  }, [allColors, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, filtered.length);

  async function handleDelete(id) {
    if (!window.confirm('এই color মুছে ফেলবেন?')) return;
    try {
      await colorService.delete(id);
      refetch();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleToggleStatus(color) {
    const active = color.status === 'Active' || color.status === 'active';
    const nextStatus = active ? 'Inactive' : 'Active';
    setStatusUpdatingId(color.Id);
    try {
      await colorService.update(color.Id, {
        name: color.name,
        hex: color.hex || '#8B0000',
        status: nextStatus,
      });
      refetch();
    } catch (e) {
      alert(e.message || 'Color status update করতে সমস্যা হয়েছে');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Color Manage</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('create_color')}
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Create
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded transition">
              <Copy size={12} /> Copy
            </button>
            <button className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded transition">
              <Printer size={12} /> Print
            </button>
            <button className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded transition">
              <FileText size={12} /> PDF
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Search size={13} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 w-44 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        {loading && <div className="text-center py-8 text-gray-400 text-xs">Loading...</div>}
        {error && <div className="text-center py-8 text-red-400 text-xs">{error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-gray-500 font-semibold w-16">SL</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-semibold">Color Name</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-semibold w-32">Status</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-semibold w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((color, i) => {
                  const hex = color.hex || '#cccccc';
                  const dark = isDark(hex);
                  const isWhiteish = ['#ffffff', '#fffff0', '#ffffe0', '#fffacd', '#f5f5dc'].includes(hex.toLowerCase());
                  return (
                    <tr key={color.Id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-2.5 text-gray-400 font-medium">{start + i}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-semibold ${isWhiteish ? 'border border-gray-300' : ''}`}
                          style={{ background: hex, color: dark ? '#fff' : (isWhiteish ? '#374151' : '#1f2937') }}
                        >
                          {color.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={color.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditColor && onEditColor(color)}
                            className="w-6 h-6 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete(color.Id)}
                            className="w-6 h-6 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition"
                          >
                            <Trash2 size={11} />
                          </button>
                          <StatusToggleBtn
                            active={color.status === 'Active' || color.status === 'active'}
                            loading={statusUpdatingId === color.Id}
                            onClick={() => handleToggleStatus(color)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">কোনো কালার পাওয়া যায়নি</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-500">
            Showing {filtered.length === 0 ? 0 : start} to {end} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={13} />
            </PageBtn>
            {buildRange(currentPage, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`d${i}`} className="w-7 text-center text-gray-400 text-xs">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition ${p === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {p}
                </button>
              )
            )}
            <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight size={13} />
            </PageBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active' || status === 'active';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function StatusToggleBtn({ active, loading, onClick }) {
  return (
    <button
      type="button"
      title={active ? 'Make Inactive' : 'Make Active'}
      onClick={onClick}
      disabled={loading}
      className={`w-6 h-6 rounded flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
    </button>
  );
}

function PageBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded flex items-center justify-center transition ${disabled ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
      {children}
    </button>
  );
}

function buildRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
