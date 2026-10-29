import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const fmt = (n) => Number(n || 0).toLocaleString("en-BD");
const fmtMoney = (n) => fmt(Number(n || 0));
const iso = (date) => date.toISOString().slice(0, 10);

const DATE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7_days", label: "Last 7 Days" },
  { key: "last_30_days", label: "Last 30 Days" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
  { key: "last_year", label: "Last Year" },
  { key: "max", label: "Max" },
  { key: "custom", label: "Custom Range" },
];

const ORDER_SOURCE_OPTIONS = [
  "Website",
  "Facebook",
  "Google",
  "WooCommerce",
  "Landing Page",
  "POS",
  "Manual",
  "Other",
];

const SOURCE_COLORS = ["#0f9f8f", "#2f80ed", "#d63b8c", "#7f9630", "#6554e8", "#f27b20", "#10b981", "#6b7280", "#ef4444"];

function getDateRange(key) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (key === "today") return { fromDate: iso(now), toDate: iso(now) };
  if (key === "yesterday") {
    start.setDate(now.getDate() - 1);
    return { fromDate: iso(start), toDate: iso(start) };
  }
  if (key === "last_7_days") {
    start.setDate(now.getDate() - 6);
    return { fromDate: iso(start), toDate: iso(end) };
  }
  if (key === "last_30_days") {
    start.setDate(now.getDate() - 29);
    return { fromDate: iso(start), toDate: iso(end) };
  }
  if (key === "this_month") {
    return {
      fromDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
      toDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  if (key === "last_month") {
    return {
      fromDate: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      toDate: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  if (key === "this_year") {
    return {
      fromDate: iso(new Date(now.getFullYear(), 0, 1)),
      toDate: iso(new Date(now.getFullYear(), 11, 31)),
    };
  }
  if (key === "last_year") {
    return {
      fromDate: iso(new Date(now.getFullYear() - 1, 0, 1)),
      toDate: iso(new Date(now.getFullYear() - 1, 11, 31)),
    };
  }
  return { fromDate: "", toDate: "" };
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  return [day, month, year].filter(Boolean).join("-");
}

function dateSubtitle(fromDate, toDate) {
  if (!fromDate && !toDate) return "All time";
  if (fromDate && toDate) return formatDate(fromDate) + " to " + formatDate(toDate);
  if (fromDate) return "From " + formatDate(fromDate);
  return "Until " + formatDate(toDate);
}

function DropdownButton({ label, options, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-800"
      >
        {label}
        <span className="text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect(option.key);
              }}
              className={[
                "block w-full px-3 py-2 text-left hover:bg-purple-50",
                option.active ? "bg-purple-700 font-bold text-white hover:bg-purple-700" : "text-gray-700",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartPanel({ title, fromDate, toDate, rows, total, loading, actions, customRange, compact = false }) {
  const chartRows = rows.filter((row) => row.count > 0);
  const layoutClass = compact
    ? "grid gap-4 p-4 xl:grid-cols-1 2xl:grid-cols-[minmax(220px,300px)_1fr]"
    : "grid gap-5 p-4 lg:grid-cols-[minmax(280px,420px)_1fr]";
  const chartHeight = compact ? 240 : 320;
  const innerRadius = compact ? 58 : 78;
  const outerRadius = compact ? 100 : 132;
  const cardGridClass = compact
    ? "grid content-start gap-2 grid-cols-2 sm:grid-cols-3 2xl:grid-cols-2"
    : "grid content-start gap-2 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">{dateSubtitle(fromDate, toDate)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
        {customRange}
      </div>

      <div className={layoutClass}>
        <div className={compact ? "relative h-[240px]" : "relative h-[320px]"}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-28 w-28 animate-spin rounded-full border-4 border-gray-100 border-t-purple-600" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <PieChart>
                  <Pie
                    data={chartRows.length ? chartRows : [{ label: "No Data", count: 1, color: "#e5e7eb" }]}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={1}
                  >
                    {(chartRows.length ? chartRows : [{ color: "#e5e7eb" }]).map((entry, index) => (
                      <Cell key={index} fill={entry.color || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [fmt(value), name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className={compact ? "text-4xl font-medium leading-none text-gray-500" : "text-5xl font-medium leading-none text-gray-500"}>{fmt(total)}</span>
              </div>
            </>
          )}
        </div>

        <div className={cardGridClass}>
          {loading
            ? Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded border border-gray-200 bg-gray-50" />
              ))
            : rows.map((row, index) => (
                <div key={row.key || row.source || row.label || index} className="min-w-0 rounded border border-gray-200 bg-white p-3">
                  <div className="break-words text-xs font-bold leading-tight text-gray-600" title={row.label}>{row.label}</div>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1 text-sm font-bold text-gray-800">
                    <span className="h-5 w-1 rounded-full" style={{ backgroundColor: row.color || "#94a3b8" }} />
                    <span>{fmt(row.count)}</span>
                    <span className="font-semibold text-gray-500">({fmtMoney(row.totalBill)})</span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

export default function EmployeeDashboardCharts({ data, loading, fromDate, toDate, onDateRangeChange }) {
  const [dateKey, setDateKey] = useState("this_month");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState(fromDate || "");
  const [customTo, setCustomTo] = useState(toDate || "");

  const dateLabel = DATE_OPTIONS.find((option) => option.key === dateKey)?.label || "This Month";
  const sourceRowsRaw = data?.ordersBySource || [];

  const sourceRows = useMemo(() => {
    const bySource = new Map();
    sourceRowsRaw
      .filter((row) => row.source !== "total")
      .forEach((row) => {
        const source = row.source || "No Source";
        bySource.set(source, row);
      });

    const expectedRows = ORDER_SOURCE_OPTIONS.map((source, index) => {
      const row = bySource.get(source) || {};
      bySource.delete(source);
      return {
        ...row,
        source,
        label: row.label || source,
        count: Number(row.count || 0),
        totalBill: Number(row.totalBill || 0),
        color: row.color || SOURCE_COLORS[index % SOURCE_COLORS.length],
      };
    });

    const extraRows = Array.from(bySource.entries()).map(([source, row], index) => ({
      ...row,
      source,
      label: row.label || source,
      count: Number(row.count || 0),
      totalBill: Number(row.totalBill || 0),
      color: row.color || SOURCE_COLORS[(ORDER_SOURCE_OPTIONS.length + index) % SOURCE_COLORS.length],
    }));

    return [...expectedRows, ...extraRows];
  }, [sourceRowsRaw]);

  const sourceOptions = useMemo(() => [
    { key: "all", label: "Order Source", active: sourceFilter === "all" },
    ...sourceRows.map((row) => ({
      key: row.source,
      label: row.label || row.source,
      active: sourceFilter === row.source,
    })),
  ], [sourceFilter, sourceRows]);

  const handleDateSelect = (key) => {
    setDateKey(key);
    if (key === "custom") return;
    const range = getDateRange(key);
    setCustomFrom(range.fromDate);
    setCustomTo(range.toDate);
    onDateRangeChange?.(range);
  };

  const applyCustomRange = () => {
    onDateRangeChange?.({ fromDate: customFrom, toDate: customTo });
  };

  const dateActions = (
    <DropdownButton
      label={dateLabel}
      options={DATE_OPTIONS.map((option) => ({ ...option, active: option.key === dateKey }))}
      onSelect={handleDateSelect}
    />
  );

  const customRange = dateKey === "custom" ? (
    <div className="mt-3 flex w-full flex-wrap items-center justify-end gap-2">
      <input
        type="date"
        value={customFrom}
        onChange={(event) => setCustomFrom(event.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
      />
      <input
        type="date"
        value={customTo}
        onChange={(event) => setCustomTo(event.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
      />
      <button
        type="button"
        onClick={applyCustomRange}
        className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
      >
        Apply
      </button>
    </div>
  ) : null;

  const ordersByStatus = (data?.ordersByStatus || []).map((row) => ({
    ...row,
    key: row.status,
  }));
  const statusRows = ordersByStatus.filter((row) => row.status !== "all");
  const statusTotal = ordersByStatus.find((row) => row.status === "all")?.count || data?.summary?.totalOrders || 0;

  const filteredSourceRows = sourceFilter === "all"
    ? sourceRows
    : sourceRows.filter((row) => row.source === sourceFilter);
  const sourceTotal = filteredSourceRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const allSourceTotal = sourceRowsRaw.find((row) => row.source === "total")?.count || sourceRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const sourceLabel = sourceFilter === "all" ? "Order Source" : sourceFilter;

  return (
    <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ChartPanel
          title="Order Status Percentage"
          fromDate={fromDate}
          toDate={toDate}
          rows={statusRows}
          total={statusTotal}
          loading={loading}
          actions={dateActions}
          customRange={customRange}
        />
        <ChartPanel
          compact
          title="Order Source"
          fromDate={fromDate}
          toDate={toDate}
          rows={filteredSourceRows}
          total={sourceFilter === "all" ? allSourceTotal : sourceTotal}
          loading={loading}
          actions={
            <>
              <DropdownButton label={sourceLabel} options={sourceOptions} onSelect={setSourceFilter} />
              {dateActions}
            </>
          }
          customRange={customRange}
        />
      </div>
    </main>
  );
}
