import { useMemo } from "react";
import { Download, Loader2, X } from "lucide-react";
import { downloadCsv } from "../utils/csv";

// Columns summed in the footer; everything else (names, percentages) is left blank there.
const SUM_COLUMNS = new Set([
  "orders",
  "amount",
  "quantity",
  "delivered",
  "failed",
  "total",
  "cancelled",
  "returned",
]);

export default function OrderReportModal({ title, report, loading, error, onClose }) {
  const columns = useMemo(() => report?.columns || [], [report]);
  const rows = useMemo(() => report?.rows || [], [report]);

  // Status columns of "Items Status Wise" are numeric too, so sum every column that only has numbers.
  const totals = useMemo(() => {
    if (!rows.length) return null;
    return columns.map((column, index) => {
      if (index === 0) return "Total";
      const numeric =
        SUM_COLUMNS.has(column.key) ||
        rows.every((row) => typeof row[column.key] === "number");
      if (!numeric || column.key === "phone") return "";
      const sum = rows.reduce((acc, row) => acc + (Number(row[column.key]) || 0), 0);
      return Math.round(sum * 100) / 100;
    });
  }, [columns, rows]);

  function handleDownload() {
    const name = (report?.title || title).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCsv(`${name}-${new Date().toISOString().slice(0, 10)}.csv`, columns, rows);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 px-4 pt-7"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[960px] flex-col overflow-hidden rounded bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">{report?.title || title}</h2>
            {report && (
              <p className="text-[11px] text-gray-500">
                Filtered orders: {report.totalOrders} · Rows: {rows.length}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rows.length > 0 && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex h-8 items-center gap-1 rounded bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-700"
              >
                <Download size={13} />
                CSV
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-auto px-4 py-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Loading report...
            </div>
          )}
          {!loading && error && (
            <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}
          {!loading && !error && report && rows.length === 0 && (
            <div className="py-10 text-center text-xs text-gray-400">No data for the current filter</div>
          )}
          {!loading && !error && rows.length > 0 && (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-gray-500">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className="px-3 py-2 align-top text-gray-700">
                        {row[column.key] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-800">
                    {totals.map((value, index) => (
                      <td key={columns[index].key} className="px-3 py-2">
                        {value}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
