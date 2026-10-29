import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n) => Number(n || 0).toLocaleString('en-BD');

export default function DonutChart({ ordersByStatus = [], summary = {}, loading }) {
  const delivered   = ordersByStatus.find((o) => o.status === 'delivered')   || {};
  const returned    = ordersByStatus.find((o) => o.status === 'returned')    || {};
  const allRow      = ordersByStatus.find((o) => o.status === 'all')         || {};

  const processingStatuses = ['pre_order','pending','packaging','confirmed','in_courier','on_hold','incomplete'];
  const processingPct = processingStatuses.reduce(
    (s, k) => s + (ordersByStatus.find((o) => o.status === k)?.percent || 0), 0
  );

  const data = [
    { name: 'Delivered',   value: delivered.percent   || 0, color: '#22c55e' },
    { name: 'Processing',  value: processingPct,             color: '#f59e0b' },
    { name: 'Returned',    value: returned.percent    || 0, color: '#ef4444' },
    { name: 'Other',       value: Math.max(0, 100 - (delivered.percent || 0) - processingPct - (returned.percent || 0)), color: '#e5e7eb' },
  ].filter((d) => d.value > 0);

  const totalBill   = allRow.totalBill || summary.totalSales || 0;
  const totalOrders = allRow.count     || summary.totalOrders || 0;

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center">
      <div className="text-xs text-gray-400 mb-1 self-start">Order Distribution</div>
      <div className="relative w-full" style={{ height: 200 }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-gray-100 border-t-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" strokeWidth={2}>
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-xs text-gray-500 font-medium">Total Value</div>
              <div className="text-lg font-bold text-gray-800">৳ {fmt(totalBill)}</div>
              <div className="text-xs text-gray-400">{fmt(totalOrders)} Orders</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
