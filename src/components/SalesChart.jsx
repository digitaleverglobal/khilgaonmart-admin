import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SalesChart({ salesChart = [], loading }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm font-semibold text-gray-700 mb-4">Last 30 days sales reports</div>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-teal-400 animate-spin" />
        </div>
      ) : salesChart.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-gray-400">No sales data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={salesChart} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              angle={-45}
              textAnchor="end"
              interval={2}
              height={60}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v) => [`৳ ${Number(v).toLocaleString('en-BD')}`, 'Sales']}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={() => 'Last 30 days sales reports'}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#F17A23"
              strokeWidth={2}
              dot={{ r: 2, fill: '#F17A23' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
