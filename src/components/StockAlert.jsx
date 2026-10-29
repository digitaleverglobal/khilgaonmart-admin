import { useState, useEffect } from "react";
import { apiRequest } from "../utils/apiClient";

export default function StockAlert({ onViewAll }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest("/product?limit=10&sortBy=Id&sortOrder=DESC")
      .then((res) => {
        if (!cancelled) setProducts(res.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(90deg, #0B3A4D, #156B8C)" }}
      >
        <span className="text-white font-semibold text-sm">Products</span>
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
              SKU
            </th>
            <th className="text-right px-4 py-2.5 text-gray-500 font-medium text-xs">
              Status
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
                  <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="h-4 w-14 bg-gray-200 rounded-full ml-auto" />
                </td>
              </tr>
            ))
          ) : products.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                No products found
              </td>
            </tr>
          ) : (
            products.map((p, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs border border-gray-200">
                    IMG
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs max-w-[160px] truncate">
                  {p.name}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">
                  {p.sku || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {p.status || "Active"}
                  </span>
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
