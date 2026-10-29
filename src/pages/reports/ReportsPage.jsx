import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Printer, RefreshCw } from 'lucide-react';
import { reportService } from '../../services/reportService';

const money = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const configs = {
  stock_report: { title: 'Stock Reports', headers: ['SL', 'Product', 'Category', 'Purchase Price', 'Sale Price', 'Stock', 'Purchase Value', 'Sale Value'], fields: ['product', 'category', 'purchasePrice', 'salePrice', 'stock', 'purchaseValue', 'saleValue'], filters: ['category', 'product', 'dates'], summary: [['Total Purchase Value', 'totalPurchaseValue'], ['Total Stock Qty', 'totalStockQty'], ['Total Sale Value', 'totalSaleValue']] },
  stock_alert_report: { title: 'Stock Alert Reports', headers: ['SL', 'Product', 'Category', 'Stock', 'Alert Qty'], fields: ['product', 'category', 'stock', 'alertQty'], filters: ['category', 'product'] },
  purchase_report: { title: 'Purchase Reports', headers: ['SL', 'Date', 'Invoice', 'Supplier', 'Status', 'Total Qty', 'Total Amount'], fields: ['date', 'invoice', 'supplier', 'status', 'qty', 'amount'], filters: ['search', 'supplier', 'dates'], summary: [['Total Quantity', 'totalQty'], ['Total Amount', 'totalAmount']] },
  order_reports: { title: 'Order Reports', headers: ['SL', 'Date', 'Invoice', 'Customer', 'Status', 'Total Qty', 'Total Amount'], fields: ['date', 'invoice', 'customer', 'status', 'qty', 'amount'], filters: ['search', 'status', 'dates'], summary: [['Total Quantity', 'totalQty'], ['Total Amount', 'totalAmount']] },
  sales_reports: { title: 'Sales Reports (Delivered)', headers: ['SL', 'Date', 'Invoice', 'Customer', 'Total Qty', 'Total Amount'], fields: ['date', 'invoice', 'customer', 'qty', 'amount'], filters: ['search', 'dates'], summary: [['Total Quantity', 'totalQty'], ['Total Sales', 'totalAmount']] },
  expense_reports: { title: 'Expense Reports', headers: ['SL', 'Date', 'Name', 'Category', 'Amount', 'Note'], fields: ['date', 'name', 'category', 'amount', 'note'], filters: ['search', 'expenseCategory', 'dates'], summary: [['Total Expense', 'totalAmount']] },
  loss_profit: { title: 'Loss/Profit', headers: ['SL', 'Particular', 'Amount'], fields: ['name', 'amount'], filters: ['dates'] },
};
const initialFilters = { search: '', categoryId: '', productId: '', supplierId: '', status: '', expenseCategoryId: '', fromDate: '', toDate: '', limit: 50 };

export default function ReportsPage({ reportKey }) {
  const config = configs[reportKey] || configs.stock_report;
  const [options, setOptions] = useState({ categories: [], products: [], suppliers: [], expenseCategories: [], orderStatuses: [] });
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ rows: [], meta: {}, summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { reportService.getOptions().then((res) => setOptions(res.data || {})).catch(() => {}); }, []);
  useEffect(() => {
    let active = true;
    reportService.get(reportKey, { ...filters, page })
      .then((res) => { if (active) { setResult(res.data || { rows: [], meta: {}, summary: {} }); setError(''); } })
      .catch((err) => { if (active) setError(err.message || 'Report load failed'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reportKey, filters, page]);

  const products = useMemo(() => draft.categoryId ? (options.products || []).filter((p) => Number(p.categoryId) === Number(draft.categoryId)) : options.products || [], [draft.categoryId, options.products]);
  const totalPages = result.meta?.totalPages || 1;
  const set = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  const apply = (event) => { event.preventDefault(); setLoading(true); setPage(1); setFilters({ ...draft }); };
  const changePage = (nextPage) => { setLoading(true); setPage(nextPage); };

  function exportCsv() {
    const rows = [config.headers, ...(result.rows || []).map((row, index) => [((result.meta.page || 1) - 1) * (result.meta.limit || 50) + index + 1, ...config.fields.map((field) => row[field] ?? '')])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })); link.download = `${reportKey}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  return (
    <div className="report-page flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">{config.title}</h1>
        <div className="no-print flex gap-2"><ActionButton icon={Download} label="Excel" onClick={exportCsv} tone="teal" /><ActionButton icon={Printer} label="Print" onClick={() => window.print()} tone="rose" /></div>
      </div>
      <div className="rounded bg-white p-6 shadow-sm">
        <form onSubmit={apply} className="no-print mb-5 flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-slate-50 p-4">
          <label className="text-xs text-gray-600">Rows<select value={draft.limit} onChange={(e) => set('limit', Number(e.target.value))} className="mt-1 block h-9 rounded border px-3"><option>10</option><option>20</option><option>50</option><option>100</option></select></label>
          {config.filters.includes('search') && <Field label="Search"><input value={draft.search} onChange={(e) => set('search', e.target.value)} placeholder="Invoice, name..." className="control" /></Field>}
          {config.filters.includes('category') && <Field label="Category"><Select value={draft.categoryId} onChange={(e) => { set('categoryId', e.target.value); set('productId', ''); }} options={options.categories} /></Field>}
          {config.filters.includes('product') && <Field label="Product"><Select value={draft.productId} onChange={(e) => set('productId', e.target.value)} options={products} /></Field>}
          {config.filters.includes('supplier') && <Field label="Supplier"><Select value={draft.supplierId} onChange={(e) => set('supplierId', e.target.value)} options={options.suppliers} /></Field>}
          {config.filters.includes('status') && <Field label="Status"><select value={draft.status} onChange={(e) => set('status', e.target.value)} className="control"><option value="">All</option>{(options.orderStatuses || []).map((value) => <option key={value}>{value}</option>)}</select></Field>}
          {config.filters.includes('expenseCategory') && <Field label="Category"><Select value={draft.expenseCategoryId} onChange={(e) => set('expenseCategoryId', e.target.value)} options={options.expenseCategories} /></Field>}
          {config.filters.includes('dates') && <><Field label="Start Date"><input type="date" value={draft.fromDate} onChange={(e) => set('fromDate', e.target.value)} className="control" /></Field><Field label="End Date"><input type="date" value={draft.toDate} onChange={(e) => set('toDate', e.target.value)} className="control" /></Field></>}
          <button className="h-9 rounded bg-indigo-600 px-4 text-xs font-semibold text-white">Filter</button>
          <button type="button" onClick={() => { setLoading(true); setDraft(initialFilters); setFilters(initialFilters); setPage(1); }} className="h-9 rounded border px-3 text-xs text-gray-600"><RefreshCw size={14} /></button>
        </form>
        {config.summary && <div className="mb-5 flex flex-wrap gap-5 text-xs font-semibold text-gray-600">{config.summary.map(([label, key]) => <span key={key}>{label}: {key.toLowerCase().includes('qty') ? Number(result.summary?.[key] || 0) : `${money(result.summary?.[key])} Tk`}</span>)}</div>}
        {error && <p className="py-8 text-center text-sm text-red-500">{error}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-xs"><thead><tr className="bg-slate-100">{config.headers.map((header) => <th key={header} className="border px-3 py-3 text-left">{header}</th>)}</tr></thead><tbody>
          {loading ? <tr><td colSpan={config.headers.length} className="py-10 text-center">Loading...</td></tr> : !result.rows?.length ? <tr><td colSpan={config.headers.length} className="py-10 text-center text-gray-400">No data found</td></tr> : result.rows.map((row, index) => <tr key={row.id || row.name} className="hover:bg-slate-50"><td className="cell">{((result.meta.page || 1) - 1) * (result.meta.limit || 50) + index + 1}</td>{config.fields.map((field) => <td key={field} className="cell">{field === 'product' ? <span className="flex items-center gap-2"><button title="View product" onClick={() => window.location.assign('/#page=products&productPage=products_manage')} className="no-print rounded bg-indigo-600 p-1.5 text-white"><Eye size={12} /></button>{row[field]}</span> : ['amount', 'purchasePrice', 'salePrice', 'purchaseValue', 'saleValue'].includes(field) ? money(row[field]) : row[field]}</td>)}</tr>)}
        </tbody></table></div>
        <div className="no-print mt-5 flex items-center justify-between text-xs text-gray-500"><span>{result.meta?.count || 0} records</span><div className="flex gap-1"><button disabled={page <= 1} onClick={() => changePage(page - 1)} className="page-btn">‹</button><span className="px-3 py-2">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="page-btn">›</button></div></div>
      </div>
      <style>{`@media print {.no-print, aside, header {display:none!important}.report-page{padding:0!important;overflow:visible!important}.report-page table{font-size:10px}} .control{height:36px;min-width:150px;border:1px solid #cbd5e1;border-radius:4px;padding:0 10px;background:white}.cell{border:1px solid #e2e8f0;padding:10px 12px;color:#4b5563}.page-btn{height:32px;min-width:32px;border:1px solid #e2e8f0;border-radius:4px}.page-btn:disabled{opacity:.4}`}</style>
    </div>
  );
}
function Field({ label, children }) { return <label className="text-xs text-gray-600">{label}<span className="mt-1 block">{children}</span></label>; }
function Select({ value, onChange, options = [] }) { return <select value={value} onChange={onChange} className="control"><option value="">All</option>{options.map((item) => <option key={item.Id} value={item.Id}>{item.name}</option>)}</select>; }
function ActionButton({ icon: Icon, label, onClick, tone }) { return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white ${tone === 'teal' ? 'bg-teal-500' : 'bg-rose-500'}`}><Icon size={14} />{label}</button>; }
