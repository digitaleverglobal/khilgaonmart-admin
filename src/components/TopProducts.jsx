import { imageUrl } from "../utils/assetUrl";

const fmt = (n) => Number(n || 0).toLocaleString("en-BD");

export default function TopProducts({ topProducts = [], loading, onViewAll }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(90deg, #0B3A4D, #156B8C)" }}
      >
        <span className="text-white font-semibold text-sm">
          Top Selling Products
        </span>
        <button
          onClick={onViewAll}
          className="bg-teal-400 hover:bg-teal-500 text-white text-xs font-medium px-3 py-1 rounded-full transition"
        >
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">
              Image
            </th>
            <th className="text-left px-4 py-2.5 text-gray-500 font-medium text-xs">
              Name
            </th>
            <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">
              Qty
            </th>
            <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50 animate-pulse">
                <td className="px-4 py-3">
                  <div className="w-10 h-10 bg-gray-200 rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-3 w-40 bg-gray-200 rounded" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="h-3 w-8 bg-gray-200 rounded ml-auto" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
                </td>
              </tr>
            ))
          ) : topProducts.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                No data available
              </td>
            </tr>
          ) : (
            topProducts.map((p, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  {p.productImage ? (
                    <img
                      src={imageUrl(p.productImage)}
                      alt={p.productName}
                      className="w-10 h-10 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs border border-gray-200 ${p.productImage ? "hidden" : "flex"}`}
                  >
                    IMG
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs max-w-[160px] truncate">
                  {p.productName}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 text-xs">
                  {fmt(p.qty)}
                </td>
                <td className="px-4 py-3 text-right text-gray-800 font-medium text-xs">
                  ৳ {fmt(p.total)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
