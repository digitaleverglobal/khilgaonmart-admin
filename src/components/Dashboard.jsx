import { useState } from "react";
import StatCards from "./StatCards";
import DonutChart from "./DonutChart";
import DeliveryStats from "./DeliveryStats";
import OrderSummary from "./OrderSummary";
import DateFilterPanel from "./DateFilterPanel";
import SalesChart from "./SalesChart";
import TopProducts from "./TopProducts";
import StockAlert from "./StockAlert";
import EmployeeDashboardCharts from "./EmployeeDashboardCharts";
import { SectionHeader } from "./OrderSummary";
import { useDashboard } from "../hooks/useDashboard";
import { useAuth } from "../context/AuthContext";

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (date) => date.toISOString().slice(0, 10);
  return { fromDate: fmt(start), toDate: fmt(end) };
}

export default function Dashboard() {
  const { user } = useAuth();
  const isEmployee =
    String(user?.role || "")
      .trim()
      .toLowerCase() === "employee";
  const currentMonth = getCurrentMonthRange();
  const [fromDate, setFromDate] = useState(
    isEmployee ? currentMonth.fromDate : "",
  );
  const [toDate, setToDate] = useState(isEmployee ? currentMonth.toDate : "");

  const { data, loading } = useDashboard({ fromDate, toDate });

  function handleFilterChange({ fromDate: f, toDate: t }) {
    setFromDate(f);
    setToDate(t);
  }

  const summary = data?.summary || {};
  const ordersByStatus = data?.ordersByStatus || [];
  const salesChart = data?.salesChart || [];
  const topProducts = data?.topProducts || [];
  const deliveryStats = data?.deliveryStats || [];

  if (isEmployee) {
    return (
      <EmployeeDashboardCharts
        data={data}
        loading={loading}
        fromDate={fromDate}
        toDate={toDate}
        onDateRangeChange={handleFilterChange}
      />
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Top Section: Dashboard stats + Date Filter */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: stat cards + donut + delivery */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <SectionHeader title="Dashboard" />
            <div className="p-4">
              <StatCards summary={summary} loading={loading} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DonutChart
              ordersByStatus={ordersByStatus}
              summary={summary}
              loading={loading}
            />
            <DeliveryStats deliveryStats={deliveryStats} loading={loading} />
          </div>
        </div>

        {/* Right: Date Filter panel */}
        <div className="xl:col-span-1">
          <DateFilterPanel
            onFilterChange={handleFilterChange}
            filteredData={data}
            loading={loading}
          />
        </div>
      </div>

      {/* Order Summary */}
      <OrderSummary ordersByStatus={ordersByStatus} loading={loading} />

      {/* Sales Chart */}
      <SalesChart salesChart={salesChart} loading={loading} />

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TopProducts topProducts={topProducts} loading={loading} />
        <StockAlert />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-2">
        © Khilgaon Mart{" "}
        <span className="text-blue-500 cursor-pointer hover:underline">
          DigitalEver
        </span>
      </div>
    </main>
  );
}
