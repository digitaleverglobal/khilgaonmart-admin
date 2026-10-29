const fmt = (n) => Number(n || 0).toLocaleString('en-BD');

export default function OrderSummary({ ordersByStatus = [], loading }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <SectionHeader title="Order Summary" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white p-4 flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-200" />
              </div>
            ))
          : ordersByStatus.map((o, i) => (
              <div key={i} className="bg-white p-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {o.status === 'all' ? `${fmt(o.totalBill)}` : `${fmt(o.totalBill)} ৳`}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{o.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{fmt(o.count)} Orders</div>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm text-white"
                  style={{ background: o.color }}
                >
                  {o.percent === 0 ? '0%' : `${o.percent}%`}
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

export function SectionHeader({ title }) {
  return (
    <div
      className="px-4 py-3 text-white font-semibold text-sm"
      style={{ background: 'linear-gradient(90deg, #0B3A4D, #156B8C)' }}
    >
      {title}
    </div>
  );
}
