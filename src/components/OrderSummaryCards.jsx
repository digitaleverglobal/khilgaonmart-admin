import { useEffect, useState } from "react";
import { ChevronDown, Info, Loader2 } from "lucide-react";
import { orderService } from "../services/orderService";

const money = (value) =>
  `${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Tk`;

function parseMeta(note) {
  try {
    const meta = JSON.parse(note || "");
    return meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
  } catch {
    return {};
  }
}

// Totals of the selected orders (or the visible page when nothing is selected).
export function SelectionSummaryCard({ orders, selectedCount }) {
  const totals = orders.reduce(
    (acc, order) => {
      const meta = parseMeta(order.note);
      const total = Number(order.totalBill || meta.total || 0);
      const shipping = Number(meta.deliveryCharge || 0);
      const discount = Number(meta.discount || meta.less || 0);
      const paid = Number(order.advance || meta.advance || meta.paid || 0);
      const productTotal =
        meta.subtotal !== undefined ? Number(meta.subtotal) : total - shipping + discount;
      acc.productTotal += productTotal;
      acc.discount += discount;
      acc.shipping += shipping;
      acc.grandTotal += total;
      acc.paid += paid;
      acc.due += Math.max(0, total - paid);
      if (String(order.status).toLowerCase() === "returned") acc.returned += total;
      return acc;
    },
    { productTotal: 0, discount: 0, shipping: 0, grandTotal: 0, paid: 0, due: 0, returned: 0 },
  );

  const lines = [
    ["Product Total", totals.productTotal, "Items price before discount"],
    ["Discount", totals.discount],
    ["After Discount", totals.productTotal - totals.discount, "Product total minus discount"],
    ["Total Shipping", totals.shipping],
    ["Grand Total", totals.grandTotal, "After discount + shipping"],
    ["Paid", totals.paid],
    ["Due", totals.due],
  ];

  return (
    <div className="rounded-xl bg-white shadow">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">Summary</h2>
        <p className="text-[11px] text-gray-500">
          {selectedCount
            ? `${selectedCount} selected order`
            : `No order selected · showing this page (${orders.length})`}
        </p>
      </div>
      <div className="space-y-1.5 px-4 py-3 text-xs text-gray-700">
        {lines.map(([label, value, info]) => (
          <div key={label}>
            <span className="font-semibold">{label}:</span>{" "}
            {info && (
              <span title={info} className="inline-block align-middle text-gray-400">
                <Info size={11} />
              </span>
            )}{" "}
            {money(value)}
          </div>
        ))}
        <div className="font-semibold text-red-500">
          Return/Damage: <span className="font-normal">{money(totals.returned)}</span>
        </div>
      </div>
    </div>
  );
}

// Sales and profit for every order that matches the applied filter.
export function SalesSummaryCard({ filterParams }) {
  const [open, setOpen] = useState(true);
  const [includeReturns, setIncludeReturns] = useState(false);
  const [state, setState] = useState({ key: "", data: null, error: "" });
  const paramsKey = JSON.stringify({ ...filterParams, includeReturns });

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    const params = JSON.parse(paramsKey);
    const { includeReturns: withReturns, ...rest } = params;
    orderService
      .getSalesSummary({ ...rest, salesIncludeReturns: withReturns ? "1" : undefined })
      .then((res) => active && setState({ key: paramsKey, data: res.data, error: "" }))
      .catch((err) => active && setState({ key: paramsKey, data: null, error: err.message || "Failed to load" }));
    return () => {
      active = false;
    };
  }, [open, paramsKey]);

  const loading = open && state.key !== paramsKey;
  const data = state.data;

  const rows = data
    ? [
        {
          label: (
            <>
              Total Sales Product Total ({data.orderCount} Orders)
              <label className="mt-1 flex items-center gap-1 text-[11px] font-normal text-gray-600">
                <input
                  type="checkbox"
                  checked={includeReturns}
                  onChange={(event) => setIncludeReturns(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                />
                Include Returns
              </label>
            </>
          ),
          value: data.productTotal,
          info: "Cancelled ও incomplete order বাদ; discount বাদ দিয়ে",
        },
        { label: `Total Shipping Charge Collected from Customer (${data.orderCount} Orders)`, value: data.shipping, tone: "green" },
        { label: `Order Total with Collected Shipping Charge (${data.orderCount} Orders)`, value: data.orderTotal },
        { label: `Courier Charge From API (${data.orderCount} Orders)`, value: data.courierApiCharge, tone: "red" },
        { label: "Courier Charge Other Expense", value: data.courierOtherExpense, tone: "red", info: "Expense category নামে courier/delivery থাকলে" },
        { label: "Total Courier Charge", value: data.totalCourierCharge, tone: "red" },
        { label: "After Reducing Courier Charge", value: data.afterCourier, bold: true },
        {
          label: (
            <>
              Purchase Amount of Sold Items ({data.soldUnits} Unit)
              <div className="text-[10px] text-gray-500">
                The cost is calculated from each variant's purchase price
              </div>
            </>
          ),
          value: data.purchaseCost,
        },
        { label: `Sales Profit/Loss (${data.soldUnits} Unit)`, value: data.salesProfit, bold: true },
        { label: "Other Income", value: data.otherIncome, tone: "green" },
        { label: "Other Expense", value: data.otherExpense, tone: "orange", info: "Courier ছাড়া বাকি expense (date range অনুযায়ী)" },
        { label: "Net Income ((Sales Profit + Other Income) - Other Expense)", value: data.netIncome, bold: true },
      ]
    : [];

  const toneClass = { green: "text-green-600", red: "font-semibold text-red-500", orange: "text-orange-500" };

  return (
    <div className="rounded-xl bg-white shadow">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-1 border-b border-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-800"
      >
        Sales Summary
        <ChevronDown size={15} className={`transition ${open ? "rotate-180" : ""}`} />
        {loading && <Loader2 size={14} className="ml-2 animate-spin text-gray-400" />}
      </button>
      {open && (
        <div className="overflow-x-auto px-4 py-3">
          {state.error && !loading && (
            <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">{state.error}</div>
          )}
          {data && (
            <table className={`w-full border border-gray-200 text-xs ${loading ? "opacity-60" : ""}`}>
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase text-gray-500">
                  <th className="border-b border-r border-gray-200 px-3 py-2 text-left font-semibold">Type</th>
                  <th className="w-56 border-b border-gray-200 px-3 py-2 text-left font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className={`border-r border-gray-200 px-3 py-2 ${row.bold ? "font-semibold text-gray-800" : "text-gray-700"} ${toneClass[row.tone] || ""}`}>
                      {row.label}
                      {row.info && (
                        <span title={row.info} className="ml-1 inline-block align-middle text-gray-400">
                          <Info size={11} />
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-2 ${row.bold ? "font-semibold text-gray-800" : "text-gray-700"} ${toneClass[row.tone] || ""}`}>
                      {money(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
