import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { visitorStatService } from '../../services/marketingService';

export default function VisitorReportsPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    visitorStatService.getStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Active Visitor',    value: stats.activeVisitor },
    { label: 'Today Visitor',     value: stats.todayVisitor },
    { label: 'Yesterday Visitor', value: stats.yesterdayVisitor },
    { label: 'This Week Visitor', value: stats.thisWeekVisitor },
    { label: 'Last Week Visitor', value: stats.lastWeekVisitor },
    { label: 'This Month Visitor',value: stats.thisMonthVisitor },
    { label: 'Last Month Visitor',value: stats.lastMonthVisitor },
    { label: 'Total Visitor',     value: stats.totalVisitor },
  ] : [];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Website Visitor Reports</h1>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
          <PlayCircle size={16} /> টিউটোরিয়াল দেখুন
        </button>
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading...</div>}
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

      {!loading && stats && (
        <>
          <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded bg-white p-7 text-center shadow-sm">
                <div className="mb-2 text-sm text-slate-400">{stat.label}</div>
                <div className="text-2xl font-bold text-gray-800">{stat.value ?? 0}</div>
              </div>
            ))}
          </div>

          <div className="rounded bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-gray-800">Last 60 days visitor reports</h2>
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart || []} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#555' }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 12, fill: '#555' }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={30} />
                  <Area type="linear" dataKey="Visitors" stroke="#3da0e3" fill="#d7eafa" strokeWidth={2}
                    dot={{ r: 2, fill: '#3da0e3' }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!loading && !error && !stats && (
        <div className="rounded bg-white p-12 text-center text-gray-400 shadow-sm">No visitor data available yet.</div>
      )}
    </div>
  );
}
