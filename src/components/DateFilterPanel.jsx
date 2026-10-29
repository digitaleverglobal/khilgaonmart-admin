import { useState } from 'react';
import { SectionHeader } from './OrderSummary';

const fmt = (n) => Number(n || 0).toLocaleString('en-BD');

const FILTER_STATUS = ['confirmed', 'packaging', 'in_courier', 'delivered', 'cancelled', 'returned'];

export default function DateFilterPanel({ onFilterChange, filteredData, loading }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate]     = useState(today);

  function handleApply() {
    if (onFilterChange) onFilterChange({ fromDate, toDate });
  }

  const summary  = filteredData?.summary        || {};
  const statuses = filteredData?.ordersByStatus || [];

  const filterStats = [
    { label: 'Total Visitors', value: fmt(summary.totalVisitors), gradient: 'linear-gradient(135deg, #135772, #1D87AB)' },
    { label: 'Total Customers', value: fmt(summary.totalCustomers), gradient: 'linear-gradient(135deg, #0C709E, #1AACE6)' },
  ];

  const orderStats = statuses.filter((o) => FILTER_STATUS.includes(o.status));

  return (
    <div className="space-y-3">
      {/* Date inputs + visitor/customer cards */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <SectionHeader title="Date Filter" />
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={handleApply}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Filtering...' : 'Apply Filter'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            {filterStats.map((s, i) => (
              <div key={i} className={`rounded-lg p-3 text-white ${loading ? 'animate-pulse' : ''}`} style={{ background: s.gradient }}>
                <div className="text-lg font-bold">{loading ? '—' : s.value}</div>
                <div className="text-xs opacity-90">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtered order stats */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <SectionHeader title="Date Filter" />
        <div className="grid grid-cols-2 gap-px bg-gray-100">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white p-3 animate-pulse flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-28 bg-gray-100 rounded" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                </div>
              ))
            : orderStats.map((o, i) => (
                <div key={i} className="bg-white p-3 flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-gray-800">{fmt(o.totalBill)} ৳</div>
                    <div className="text-xs text-gray-500 mt-0.5">{o.label}</div>
                    <div className="text-xs text-gray-400">{fmt(o.count)} Orders</div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ background: o.color }}
                  >
                    {o.percent}%
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
