import { ChevronLeft, ChevronRight } from 'lucide-react';

// Page numbers to show: always the first and last page, plus two around the current one.
function pageList(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(`gap-${p}`);
    result.push(p);
  });
  return result;
}

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / pageSize));
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn = 'h-7 min-w-7 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-500">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={`${btn} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
          <ChevronLeft size={13} /> Previous
        </button>
        {pageList(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`${btn} ${p === page ? 'bg-[#0B3A4D] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={`${btn} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
