const fmt = (n) => Number(n || 0).toLocaleString('en-BD');

export default function DeliveryStats({ deliveryStats = [], loading }) {
  const items = loading
    ? [
        { label: 'Delivered',          percent: 0, orders: 0, amount: 0, color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200' },
        { label: 'Delivery Processing', percent: 0, orders: 0, amount: 0, color: '#f59e0b', bg: 'bg-amber-50',  border: 'border-amber-200' },
        { label: 'Returned',           percent: 0, orders: 0, amount: 0, color: '#ef4444', bg: 'bg-red-50',    border: 'border-red-200'   },
      ]
    : deliveryStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
          <div className="text-sm font-semibold text-gray-700">{item.label}</div>
          <div className={`text-2xl font-bold mt-1 ${loading ? 'animate-pulse text-gray-300' : ''}`} style={{ color: loading ? undefined : item.color }}>
            {loading ? '—' : `${item.percent} %`}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {loading ? '...' : `${fmt(item.orders)} orders | ৳ ${fmt(item.amount)}`}
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(item.percent, 100)}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
