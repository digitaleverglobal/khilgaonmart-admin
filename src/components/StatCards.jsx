import { Clock, ShoppingCart, Users, UserCheck } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-BD');

export default function StatCards({ summary = {}, loading }) {
  const stats = [
    {
      label: 'Sales Amount',
      value: loading ? '—' : `৳ ${fmt(summary.totalSales)}`,
      icon: Clock,
      gradient: 'linear-gradient(135deg, #0B3A4D, #156B8C)',
    },
    {
      label: 'Total Order',
      value: loading ? '—' : fmt(summary.totalOrders),
      icon: ShoppingCart,
      gradient: 'linear-gradient(135deg, #E25F12, #F8CB2E)',
    },
    {
      label: 'Total Visitors',
      value: loading ? '—' : fmt(summary.totalVisitors),
      icon: Users,
      gradient: 'linear-gradient(135deg, #135772, #1D87AB)',
    },
    {
      label: 'Total Customers',
      value: loading ? '—' : fmt(summary.totalCustomers),
      icon: UserCheck,
      gradient: 'linear-gradient(135deg, #0C709E, #1AACE6)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div
          key={i}
          className="rounded-xl p-4 text-white flex items-center justify-between shadow"
          style={{ background: s.gradient }}
        >
          <div>
            <div className={`text-xl font-bold ${loading ? 'animate-pulse' : ''}`}>{s.value}</div>
            <div className="text-sm opacity-90 mt-0.5">{s.label}</div>
          </div>
          <div className="opacity-70">
            <s.icon size={28} />
          </div>
        </div>
      ))}
    </div>
  );
}
