import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown, Download, Loader2, Printer, X } from "lucide-react";
import { orderService } from "../services/orderService";
import { imageUrl } from "../utils/assetUrl";
import { downloadCsv } from "../utils/csv";

const money = (value) =>
  `${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tk`;
const units = (value) => (value === null || value === undefined ? "—" : `${value} Unit`);

const BASE_COLUMNS = [
  { key: "sl", label: "SL" },
  { key: "product", label: "Product" },
  { key: "image", label: "Image" },
  { key: "availableQuantity", label: "Available Quantity", format: units },
  { key: "orderQuantity", label: "Order Quantity", format: units, total: true },
  { key: "orderCount", label: "Order Count", total: true, hidden: true },
  { key: "amount", label: "Amount", format: money, total: true },
  { key: "discount", label: "Discount", format: money, total: true },
  { key: "afterDiscount", label: "After Discount", format: money, total: true },
  { key: "rackNo", label: "Rack No" },
  { key: "productCost", label: "Product Cost", format: money, total: true, hiddenInStatusWise: true },
];

const PAGE_SIZES = [
  { value: -1, label: "All" },
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

const OPTION_CHECKS = [
  { key: "includeReturns", label: "Include Returns" },
  { key: "includeOtherProducts", label: "Include Other Products", title: "Product/Category filter দিলে ঐ order এর অন্য product গুলোও দেখাবে" },
  { key: "excludeUpsales", label: "Exclude Upsales", title: '"Up Sale" tag এর order বাদ' },
  { key: "onlyUpsales", label: "Only Upsales", title: 'শুধু "Up Sale" tag এর order' },
  { key: "createTimeOnly", label: "Only Create Time Items", title: "Order তৈরির সময়ের item; পরে যোগ করা item বাদ" },
];

const statusText = (value) => (value ? `${value.quantity} Unit / ${value.orders} order${value.orders === 1 ? "" : "s"}` : "—");

// Order items of the orders matching the current filter (filterParams).
// statusWise: page layout with one column per order status ("Order Items — Status Wise");
// otherwise the "Packing Product List" popup.
export default function OrderItemsReport({ filterParams, onClose, statusWise = false, statuses = [] }) {
  const [groupBy, setGroupBy] = useState("variation");
  const [options, setOptions] = useState({
    includeReturns: false,
    includeOtherProducts: false,
    excludeUpsales: false,
    onlyUpsales: false,
    createTimeOnly: false,
  });
  const [visible, setVisible] = useState(() =>
    Object.fromEntries(
      BASE_COLUMNS.map((column) => [column.key, !column.hidden && !(statusWise && column.hiddenInStatusWise)]),
    ),
  );
  const [pageSize, setPageSize] = useState(-1);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "", dir: "desc" });
  const [state, setState] = useState({ key: "", rows: [], error: "" });

  const requestKey = JSON.stringify({ filterParams, groupBy, options });
  useEffect(() => {
    let active = true;
    const request = JSON.parse(requestKey);
    orderService
      .getPackingList({
        ...request.filterParams,
        groupBy: request.groupBy,
        includeReturns: request.options.includeReturns ? "1" : undefined,
        includeOtherProducts: request.options.includeOtherProducts ? "1" : undefined,
        upsales: request.options.excludeUpsales ? "exclude" : request.options.onlyUpsales ? "only" : undefined,
        createTimeOnly: request.options.createTimeOnly ? "1" : undefined,
      })
      .then((res) => active && setState({ key: requestKey, rows: res.data || [], error: "" }))
      .catch((err) => active && setState({ key: requestKey, rows: [], error: err.message || "Failed to load" }));
    return () => {
      active = false;
    };
  }, [requestKey]);
  const loading = state.key !== requestKey;

  // Status columns follow the configured status order; statuses missing from it go last.
  const statusColumns = useMemo(() => {
    if (!statusWise) return [];
    const present = new Set(state.rows.flatMap((row) => Object.keys(row.statuses || {})));
    const known = statuses.filter((status) => present.has(status.key));
    const extra = [...present].filter((key) => !statuses.some((status) => status.key === key));
    return [...known, ...extra.map((key) => ({ key, label: key.replace(/_/g, " ") }))].map((status) => ({
      key: `status:${status.key}`,
      statusKey: status.key,
      label: status.label,
      color: status.color,
      status: true,
    }));
  }, [statusWise, statuses, state.rows]);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = state.rows.filter(
      (row) => !term || `${row.product} ${row.variant} ${row.rackNo}`.toLowerCase().includes(term),
    );
    if (!sort.key) return list;
    const dir = sort.dir === "asc" ? 1 : -1;
    const valueOf = (row) =>
      sort.key.startsWith("status:") ? row.statuses?.[sort.key.slice(7)]?.quantity ?? 0 : row[sort.key] ?? "";
    return [...list].sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      return (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right))) * dir;
    });
  }, [state.rows, query, sort]);

  const columns = [...BASE_COLUMNS.filter((column) => visible[column.key]), ...statusColumns];
  const firstTotalIndex = columns.findIndex((column) => column.total || column.status);

  const totals = useMemo(() => {
    const result = {};
    BASE_COLUMNS.filter((column) => column.total).forEach((column) => {
      result[column.key] = rows.reduce((sum, row) => sum + (Number(row[column.key]) || 0), 0);
    });
    statusColumns.forEach((column) => {
      result[column.key] = rows.reduce(
        (sum, row) => {
          const value = row.statuses?.[column.statusKey];
          if (!value) return sum;
          return { quantity: sum.quantity + value.quantity, orders: sum.orders + value.orders, amount: sum.amount + value.amount };
        },
        { quantity: 0, orders: 0, amount: 0 },
      );
    });
    return result;
  }, [rows, statusColumns]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;
  const pageRows = pageSize === -1 ? rows : rows.slice(offset, offset + pageSize);

  const productLabel = (row) => (row.variant ? `${row.product} (${row.variant})` : row.product);

  function cellText(column, row, index) {
    if (column.key === "sl") return index + 1;
    if (column.key === "product") return productLabel(row);
    if (column.key === "image") return row.image || "";
    if (column.status) {
      const value = row.statuses?.[column.statusKey];
      return value ? `${statusText(value)} (${money(value.amount)})` : "—";
    }
    return column.format ? column.format(row[column.key]) : row[column.key] || "";
  }

  function totalText(column) {
    if (column.status) {
      const value = totals[column.key];
      return `${statusText(value)} (${money(value.amount)})`;
    }
    return column.format ? column.format(totals[column.key]) : totals[column.key];
  }

  function toggleSort(key) {
    if (key === "image" || key === "sl") return;
    setSort((current) => ({ key, dir: current.key === key && current.dir === "desc" ? "asc" : "desc" }));
  }

  const title = statusWise ? "Order Items — Status Wise" : "Packing Product List";
  const fileName = statusWise ? "order-items-status-wise" : "packing-list";

  function handleExport() {
    const exportColumns = columns.filter((column) => column.key !== "image");
    const exportRows = rows.map((row, index) =>
      Object.fromEntries(exportColumns.map((column) => [column.key, cellText(column, row, index)])),
    );
    downloadCsv(`${fileName}-${new Date().toISOString().slice(0, 10)}.csv`, exportColumns, exportRows);
  }

  function handlePrint() {
    const escape = (value) => String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
    const head = columns.map((column) => `<th>${escape(column.label)}</th>`).join("");
    const body = rows
      .map(
        (row, index) =>
          `<tr>${columns
            .map((column) =>
              column.key === "image"
                ? `<td>${row.image ? `<img src="${escape(imageUrl(row.image))}" />` : ""}</td>`
                : `<td>${escape(cellText(column, row, index))}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");
    const foot = columns
      .map((column, index) =>
        column.total || column.status
          ? `<td><b>${escape(totalText(column))}</b></td>`
          : `<td>${index === firstTotalIndex - 1 ? "<b>Total:</b>" : ""}</td>`,
      )
      .join("");
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return alert("Popup blocked — print এর জন্য popup allow করুন");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title>
      <style>body{font-family:sans-serif;font-size:12px;margin:16px}h2{margin:0 0 10px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:5px;text-align:left;vertical-align:middle}th{background:#f3f4f6;font-size:11px;text-transform:uppercase}
      img{width:44px;height:44px;object-fit:cover}</style></head><body>
      <h2>${escape(title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody><tfoot><tr>${foot}</tr></tfoot></table>
      <script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
  }

  const optionChecks = (
    <div className={statusWise ? "flex flex-wrap gap-x-4 gap-y-1" : "flex flex-col items-start"}>
      {OPTION_CHECKS.map((option) => (
        <CheckBox
          key={option.key}
          label={option.label}
          title={option.title}
          checked={options[option.key]}
          onChange={(checked) =>
            setOptions((current) => ({
              ...current,
              [option.key]: checked,
              // Exclude / Only upsales cannot both be on.
              ...(checked && option.key === "excludeUpsales" ? { onlyUpsales: false } : {}),
              ...(checked && option.key === "onlyUpsales" ? { excludeUpsales: false } : {}),
            }))
          }
        />
      ))}
    </div>
  );

  const exportButtons = (
    <>
      <button type="button" onClick={handlePrint} disabled={!rows.length} className="inline-flex h-9 items-center gap-1 rounded bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
        <Printer size={15} /> Print
      </button>
      <button type="button" onClick={handleExport} disabled={!rows.length} className="inline-flex h-9 items-center gap-1 rounded bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
        <Download size={15} /> Export
      </button>
    </>
  );

  const content = (
    <div className="px-5 py-4 text-sm">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-semibold text-gray-700">Group By:</span>
        {[
          ["variation", "Variation"],
          ["product", "Product"],
        ].map(([value, text]) => (
          <label key={value} className="inline-flex cursor-pointer items-center gap-1.5 text-gray-700">
            <input type="radio" checked={groupBy === value} onChange={() => setGroupBy(value)} className="h-4 w-4 text-teal-600 focus:ring-teal-500" />
            {text}
          </label>
        ))}
      </div>

      {statusWise && <div className="mt-2">{optionChecks}</div>}

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {BASE_COLUMNS.map((column) => (
          <CheckBox
            key={column.key}
            label={column.label}
            checked={visible[column.key]}
            onChange={(checked) => setVisible((current) => ({ ...current, [column.key]: checked }))}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-gray-600">
          Show
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-9 rounded border border-gray-300 px-2 outline-none focus:border-teal-500"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size.value} value={size.value}>{size.label}</option>
            ))}
          </select>
          entries
        </label>
        <label className="flex items-center gap-2 text-gray-600">
          Search:
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="h-9 w-56 rounded border border-gray-300 px-2 outline-none focus:border-teal-500"
          />
        </label>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className={`w-full border border-gray-200 ${loading ? "opacity-60" : ""}`}>
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
              {columns.map((column) => (
                <th key={column.key} className="border-b border-r border-gray-200 px-2 py-2.5 font-semibold last:border-r-0">
                  <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 uppercase" style={column.color ? { color: column.color } : undefined}>
                    {column.label}
                    {!["image", "sl"].includes(column.key) && (
                      <ArrowUpDown size={11} className={sort.key === column.key ? "text-teal-600" : "text-gray-300"} />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !state.rows.length && (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-gray-400">
                  <Loader2 size={18} className="mr-2 inline animate-spin" /> Loading...
                </td>
              </tr>
            )}
            {!loading && state.error && (
              <tr><td colSpan={columns.length} className="py-6 text-center text-red-500">{state.error}</td></tr>
            )}
            {!loading && !state.error && rows.length === 0 && (
              <tr><td colSpan={columns.length} className="py-6 text-center text-gray-500">No data available in table</td></tr>
            )}
            {pageRows.map((row, index) => (
              <tr key={`${row.product}-${row.variant}-${index}`} className="border-t border-gray-200 align-middle text-gray-700">
                {columns.map((column) => (
                  <td key={column.key} className="border-r border-gray-200 px-2 py-2 last:border-r-0">
                    {column.key === "image" ? (
                      <ReportImage src={row.image} />
                    ) : column.key === "product" ? (
                      <div className="max-w-[320px]">
                        <div>{productLabel(row)}</div>
                        <div className="text-[11px] text-gray-400">1 Pcs/Unit</div>
                      </div>
                    ) : column.status ? (
                      <StatusCell value={row.statuses?.[column.statusKey]} />
                    ) : (
                      <span className={column.key === "availableQuantity" && row.availableQuantity !== null && row.availableQuantity <= 0 ? "text-red-500" : ""}>
                        {cellText(column, row, offset + index)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-gray-300 font-semibold text-gray-800">
                {columns.map((column, index) => (
                  <td key={column.key} className="border-r border-gray-200 px-2 py-2.5 last:border-r-0">
                    {column.status ? (
                      <StatusCell value={totals[column.key]} strong />
                    ) : column.total ? (
                      totalText(column)
                    ) : index === firstTotalIndex - 1 ? (
                      <span className="block text-right">Total:</span>
                    ) : (
                      ""
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-gray-500">
        <span>
          Showing {rows.length ? offset + 1 : 0} to {offset + pageRows.length} of {rows.length} entries
        </span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="h-9 rounded border border-gray-200 px-3 text-sm disabled:bg-gray-100 disabled:text-gray-400">
            Previous
          </button>
          <span className="flex h-9 min-w-[36px] items-center justify-center rounded bg-teal-600 px-2 text-sm font-semibold text-white">
            {currentPage}
          </span>
          <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="h-9 rounded border border-gray-200 px-3 text-sm disabled:bg-gray-100 disabled:text-gray-400">
            Next
          </button>
        </div>
      </div>
    </div>
  );

  if (statusWise) {
    return (
      <div className="rounded-xl bg-white shadow">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="inline-flex h-9 items-center gap-1 rounded border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50">
              <ArrowLeft size={15} /> Back to Orders
            </button>
            {exportButtons}
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/45 px-4 py-6" onClick={onClose}>
      <div className="w-full max-w-6xl rounded bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
            <X size={20} />
          </button>
        </div>
        {content}
        <div className="flex flex-col items-end gap-2 border-t border-gray-200 px-5 py-4">
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded border border-gray-300 px-5 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            {exportButtons}
          </div>
          <div className="text-sm text-gray-700">{optionChecks}</div>
        </div>
      </div>
    </div>
  );
}

function StatusCell({ value, strong = false }) {
  if (!value || !value.quantity) return <span className="text-gray-300">—</span>;
  return (
    <div>
      <div className={strong ? "font-semibold" : ""}>{statusText(value)}</div>
      <div className="text-[11px] text-gray-500">{money(value.amount)}</div>
    </div>
  );
}

function CheckBox({ label, title, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-gray-700" title={title}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
      />
      {label}
    </label>
  );
}

function ReportImage({ src }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 text-[10px] text-gray-400">
      {src && !failed ? (
        <img src={imageUrl(src)} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        "No Image"
      )}
    </div>
  );
}
