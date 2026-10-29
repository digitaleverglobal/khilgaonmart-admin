import { formatInvoiceNumber } from "../utils/invoiceNumber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  Plus,
  RefreshCw,
  Loader2,
  Ban,
  X,
  List,
  CheckCircle2,
  ShieldAlert,
  Copy,
  MessageCircle,
  Printer,
  ClipboardList,
  StickyNote,
  Truck,
  Phone,
  CalendarDays,
  Boxes,
  SlidersHorizontal,
  Download,
  RotateCcw,
} from "lucide-react";
import { useOrders } from "../hooks/useOrders";
import OrderFilterPanel from "../components/OrderFilterPanel";
import OrderReportModal from "../components/OrderReportModal";
import OrderItemsReport from "../components/OrderItemsReport";
import {
  SalesSummaryCard,
  SelectionSummaryCard,
} from "../components/OrderSummaryCards";
import { downloadCsv } from "../utils/csv";
import {
  EMPTY_ORDER_FILTERS,
  ORDER_REPORTS,
  ORDER_SOURCE_OPTIONS,
  ORDER_TAG_OPTIONS,
  countActiveOrderFilters,
  toOrderFilterParams,
} from "../utils/orderFilters";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";
import { userService } from "../services/adminService";
import { orderStatusService } from "../services/websiteService";
import { ipBlockService } from "../services/websiteService";
import {
  buildStatusMaps,
  normalizeOrderStatuses,
  toOrderStatusKey,
} from "../utils/orderStatuses";
import { imageUrl } from "../utils/assetUrl";
import {
  getLogo,
  getSiteName,
  normalizeSettingData,
} from "../utils/siteBranding";
import { weightAdjustText } from "../utils/variants";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const TABLE_STATUS_UPDATE_OPTIONS = [
  "pre_order",
  "pending",
  "packaging",
  "confirmed",
  "incomplete",
];
const TABLE_STATUS_UPDATE_VIEWS = ["all", ...TABLE_STATUS_UPDATE_OPTIONS];

// Built-in status for a returned parcel that has been received back. It is not in the
// status settings and is only offered in the Returned submenu.
const RETURN_RECEIVED_STATUS = {
  key: "return_received",
  label: "Return Received",
  color: "#0f766e",
};
const RETURN_STATUS_OPTIONS = ["returned", RETURN_RECEIVED_STATUS.key];

// Status choices of the table's status dropdown for a submenu (null: read-only).
function getTableStatusOptions(view) {
  if (view === "returned") return RETURN_STATUS_OPTIONS;
  return TABLE_STATUS_UPDATE_VIEWS.includes(view) ? TABLE_STATUS_UPDATE_OPTIONS : null;
}

function getApiList(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.result)) return payload.data.result;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getEmployeeName(employee) {
  const fullName = [employee?.FirstName, employee?.LastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    employee?.name ||
    employee?.Name ||
    fullName ||
    employee?.Email ||
    employee?.Phone ||
    (employee?.Id ? `Employee #${employee.Id}` : "")
  );
}

function normalizeEmployeeOptions(rows) {
  const seen = new Set();
  return getApiList(rows)
    .filter((employee) => {
      // Every active staff account can be assigned; "user" is a customer.
      const role = String(employee?.role || "employee")
        .trim()
        .toLowerCase();
      const status = String(employee?.status || "active")
        .trim()
        .toLowerCase();
      return role !== "user" && status !== "inactive" && status !== "disabled";
    })
    .map((employee) => ({
      ...employee,
      Id: employee?.Id ?? employee?.id,
      name: employee?.role
        ? `${getEmployeeName(employee)} (${employee.role})`
        : getEmployeeName(employee),
    }))
    .filter((employee) => {
      const id = employee?.Id ?? employee?.id;
      if (!id || seen.has(String(id))) return false;
      seen.add(String(id));
      return true;
    });
}

function getAssignedEmployeeName(order) {
  return (
    order?.assignedEmployeeName ||
    getEmployeeName(order?.assignedEmployee || {})
  );
}

function getAssignedByName(order) {
  return order?.assignedByName || getEmployeeName(order?.assignedByUser || {});
}

export default function OrdersPage({
  activeStatus,
  onStatusChange,
  onCreateOrder,
  onViewOrder,
  onEditOrder,
  onPrintOrder,
  onViewCustomer,
  siteSettings,
  statusCounts = {},
  onCountsRefresh,
}) {
  const { user } = useAuth();
  const [orderStatuses, setOrderStatuses] = useState(() =>
    normalizeOrderStatuses(),
  );
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [appliedEmployeeFilter, setAppliedEmployeeFilter] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(EMPTY_ORDER_FILTERS);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] =
    useState(EMPTY_ORDER_FILTERS);
  const [reportModal, setReportModal] = useState(null);
  const [packingParams, setPackingParams] = useState(null);
  const [statusWiseParams, setStatusWiseParams] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkOrderTag, setBulkOrderTag] = useState("");
  const [bulkCustomerTag, setBulkCustomerTag] = useState("");
  const [productInfoOrder, setProductInfoOrder] = useState(null);
  const [fraudCheckOrder, setFraudCheckOrder] = useState(null);
  const [fraudCheckData, setFraudCheckData] = useState(null);
  const [fraudCheckLoading, setFraudCheckLoading] = useState(false);
  const [fraudCheckError, setFraudCheckError] = useState("");
  const [noteModal, setNoteModal] = useState(null);
  const [courierBusyId, setCourierBusyId] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkCourierBusy, setBulkCourierBusy] = useState(false);
  const [barcodePrintOrders, setBarcodePrintOrders] = useState([]);
  const [invoicePrintOrders, setInvoicePrintOrders] = useState([]);
  const [itemListPrintOrders, setItemListPrintOrders] = useState([]);
  const [itemListVariations, setItemListVariations] = useState({});
  const [stickerPrintOrders, setStickerPrintOrders] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState("");

  const { orders, meta, loading, error, refetch } = useOrders({
    status: activeStatus,
    search: appliedSearch,
    fromDate: appliedFrom,
    toDate: appliedTo,
    assignedEmployeeId: appliedEmployeeFilter,
    filters: toOrderFilterParams(appliedAdvancedFilters),
    page,
    limit: pageSize,
  });

  const visibleOrderIds = useMemo(
    () => orders.map((order) => Number(order.Id)).filter(Boolean),
    [orders],
  );
  const allVisibleSelected =
    visibleOrderIds.length > 0 &&
    visibleOrderIds.every((id) => selectedOrderIds.includes(id));
  const selectedCourierOrderIds = useMemo(
    () =>
      selectedOrderIds.filter((id) =>
        canSendOrderToCourier(
          orders.find((order) => Number(order.Id) === Number(id)),
        ),
      ),
    [orders, selectedOrderIds],
  );
  const canAssignOrders = ["superadmin", "admin"].includes(
    String(user?.role || "")
      .trim()
      .toLowerCase(),
  );
  const employeeFilterOptions = [
    { value: "all", label: "Employee: All" },
    { value: "unassigned", label: "Not Assigned" },
    ...assignees.map((employee) => ({
      value: String(employee.Id),
      label: employee.name,
    })),
  ];
  const activeAdvancedFilterCount =
    countActiveOrderFilters(appliedAdvancedFilters) +
    [appliedSearch, appliedFrom, appliedTo].filter(Boolean).length +
    (appliedEmployeeFilter !== "all" ? 1 : 0);

  useEffect(() => {
    setSelectedOrderIds((ids) =>
      ids.filter((id) => visibleOrderIds.includes(id)),
    );
  }, [visibleOrderIds]);

  useEffect(() => {
    if (!canAssignOrders) return undefined;
    let active = true;

    async function loadAssignees() {
      try {
        const res = await orderService.getAssignees();
        if (!active) return;
        const employees = normalizeEmployeeOptions(res);
        setAssignees(employees);
        setAssignError("");
      } catch (primaryError) {
        try {
          const res = await userService.getAll({ limit: 1000 });
          if (!active) return;
          const employees = normalizeEmployeeOptions(res);
          setAssignees(employees);
          setAssignError(
            employees.length ? "" : "Assign করার মতো active staff user পাওয়া যায়নি",
          );
        } catch (fallbackError) {
          if (!active) return;
          setAssignees([]);
          setAssignError(
            fallbackError.message ||
              primaryError.message ||
              "Employee list load failed",
          );
        }
      }
    }

    loadAssignees();
    return () => {
      active = false;
    };
  }, [canAssignOrders]);

  useEffect(() => {
    if (!barcodePrintOrders.length) return undefined;

    const handleAfterPrint = () => setBarcodePrintOrders([]);
    window.addEventListener("afterprint", handleAfterPrint);
    const timer = window.setTimeout(() => window.print(), 100);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [barcodePrintOrders.length]);

  useEffect(() => {
    if (!invoicePrintOrders.length) return undefined;

    const handleAfterPrint = () => setInvoicePrintOrders([]);
    window.addEventListener("afterprint", handleAfterPrint);
    const timer = window.setTimeout(() => window.print(), 100);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [invoicePrintOrders.length]);

  useEffect(() => {
    if (!itemListPrintOrders.length) return undefined;

    const handleAfterPrint = () => setItemListPrintOrders([]);
    window.addEventListener("afterprint", handleAfterPrint);
    const timer = window.setTimeout(() => window.print(), 100);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [itemListPrintOrders.length]);

  useEffect(() => {
    if (!stickerPrintOrders.length) return undefined;

    const handleAfterPrint = () => setStickerPrintOrders([]);
    window.addEventListener("afterprint", handleAfterPrint);
    const timer = window.setTimeout(() => window.print(), 100);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [stickerPrintOrders.length]);

  function handleSearch() {
    setAppliedSearch(search);
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setAppliedEmployeeFilter(employeeFilter);
    setAppliedAdvancedFilters(advancedFilters);
    setPage(1);
  }

  const appliedFilterParams = {
    status: activeStatus && activeStatus !== "all" ? activeStatus : undefined,
    search: appliedSearch || undefined,
    fromDate: appliedFrom || undefined,
    toDate: appliedTo || undefined,
    assignedEmployeeId:
      appliedEmployeeFilter && appliedEmployeeFilter !== "all"
        ? appliedEmployeeFilter
        : undefined,
    ...toOrderFilterParams(appliedAdvancedFilters),
  };

  // Reports and export use the filters currently in the panel, and apply them to the list too.
  function getPanelFilterParams() {
    return {
      status: activeStatus && activeStatus !== "all" ? activeStatus : undefined,
      search: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      assignedEmployeeId:
        employeeFilter && employeeFilter !== "all" ? employeeFilter : undefined,
      ...toOrderFilterParams(advancedFilters),
    };
  }

  async function handleReport(type) {
    handleSearch();
    const params = getPanelFilterParams();

    if (type === "order_items") {
      setPackingParams(params);
      return;
    }
    if (type === "items_status") {
      setShowFilterPanel(false);
      setStatusWiseParams(params);
      return;
    }

    if (type === "export") {
      setExporting(true);
      try {
        const res = await orderService.getReport("export", params);
        const report = res.data || {};
        if (!report.rows?.length) {
          alert("Export করার মতো কোনো order নেই");
          return;
        }
        downloadCsv(
          `orders-${new Date().toISOString().slice(0, 10)}.csv`,
          report.columns,
          report.rows,
        );
      } catch (err) {
        alert(err.message || "Export failed");
      } finally {
        setExporting(false);
      }
      return;
    }

    const title =
      ORDER_REPORTS.find((report) => report.type === type)?.label || "Report";
    setReportModal({ type, title, loading: true, report: null, error: "" });
    try {
      const res = await orderService.getReport(type, params);
      setReportModal((current) =>
        current?.type === type
          ? { ...current, loading: false, report: res.data }
          : current,
      );
    } catch (err) {
      setReportModal((current) =>
        current?.type === type
          ? { ...current, loading: false, error: err.message || "Report failed" }
          : current,
      );
    }
  }

  // Unlike the status tabs, picking a status in the panel keeps the other filters.
  function handlePanelStatusChange(key) {
    onStatusChange(key);
    setPage(1);
  }

  function handleClearAdvancedFilters() {
    setSearch("");
    setAppliedSearch("");
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
    setEmployeeFilter("all");
    setAppliedEmployeeFilter("all");
    setAdvancedFilters(EMPTY_ORDER_FILTERS);
    setAppliedAdvancedFilters(EMPTY_ORDER_FILTERS);
    setPage(1);
  }

  function handlePageSizeChange(value) {
    setPageSize(value);
    setPage(1);
  }

  function handleEmployeeFilterChange(value) {
    setEmployeeFilter(value);
    setAppliedEmployeeFilter(value);
    setPage(1);
  }

  function handleStatusClick(key) {
    onStatusChange(key);
    setPage(1);
    setSearch("");
    setAppliedSearch("");
    setAppliedFrom("");
    setAppliedTo("");
    setEmployeeFilter("all");
    setAppliedEmployeeFilter("all");
    setFromDate("");
    setToDate("");
  }

  function handleResetFilters() {
    onStatusChange("all");
    setPage(1);
    setSearch("");
    setAppliedSearch("");
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
    setAdvancedFilters(EMPTY_ORDER_FILTERS);
    setAppliedAdvancedFilters(EMPTY_ORDER_FILTERS);
    onCountsRefresh?.();
  }

  async function handleDelete(id) {
    if (!window.confirm("এই অর্ডার মুছে ফেলবেন?")) return;
    try {
      await orderService.deleteOrder(id);
      refetch();
      onCountsRefresh?.();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  async function handleBlockIp(order) {
    const ip = String(order.ipAddress || "").trim();
    if (!ip) return;
    if (!window.confirm(`${ip} IP address block করবেন?`)) return;
    try {
      await ipBlockService.create({
        ip,
        reason: `Blocked from order ${formatInvoiceNumber(order, order.Id)}`,
      });
      alert(`${ip} blocked successfully.`);
    } catch (err) {
      alert(err.message || "IP block failed");
    }
  }

  async function handleToggleFraudStatus(order) {
    const current = order.fraudGuard?.status || order.fraudStatus || "";
    const nextStatus = current === "fake" ? "safe" : "fake";
    const label = nextStatus === "fake" ? "Fake Order" : "Safe";
    if (
      !window.confirm(
        `${formatInvoiceNumber(order, order.Id)} কে ${label} mark করবেন?`,
      )
    )
      return;
    try {
      await orderService.updateOrder(order.Id, {
        fraudStatus: nextStatus,
        fraudReason:
          nextStatus === "fake"
            ? "Manually marked as fake from Fraud Guard"
            : "Manually marked as safe from Fraud Guard",
      });
      refetch();
    } catch (err) {
      alert(err.message || "Fraud status update failed");
    }
  }

  async function handleSaveOrderNote(order, noteText) {
    const note = buildOrderNoteWithAdminNote(order, noteText);
    await orderService.updateOrder(order.Id, { note });
    refetch();
  }

  async function handleReplaceOrderNotes(order, notes) {
    const note = buildOrderNoteWithAdminNotes(order, notes);
    await orderService.updateOrder(order.Id, { note });
    refetch();
  }

  async function handleSaveOrderSource(order, source) {
    const note = buildOrderNoteWithSource(order, source);
    await orderService.updateOrder(order.Id, {
      note,
      orderSource: source || "Website",
    });
    refetch();
  }

  async function handleTableStatusChange(order, status) {
    const nextStatus = toOrderStatusKey(status);
    if (!getTableStatusOptions(currentStatus)?.includes(nextStatus)) return;
    if (nextStatus === toOrderStatusKey(order.status)) return;
    try {
      await orderService.updateOrderStatus(order.Id, nextStatus);
      await refetch();
      onCountsRefresh?.();
    } catch (err) {
      alert(err.message || "Order status update failed");
    }
  }

  async function handleSendToSteadfast(order) {
    if (
      !window.confirm(
        `${formatInvoiceNumber(order, order.Id)} Steadfast courier এ পাঠাবেন?`,
      )
    )
      return;
    setCourierBusyId(order.Id);
    try {
      await orderService.sendToSteadfast(order.Id);
      await refetch();
      onCountsRefresh?.();
      alert("Steadfast courier এ order পাঠানো হয়েছে।");
    } catch (err) {
      alert(err.message || "Steadfast courier এ পাঠানো যায়নি");
    } finally {
      setCourierBusyId(null);
    }
  }

  async function handleSendToPathao(order) {
    if (
      !window.confirm(
        `${formatInvoiceNumber(order, order.Id)} Pathao courier এ পাঠাবেন?`,
      )
    )
      return;
    setCourierBusyId(order.Id);
    try {
      await orderService.sendToPathao(order.Id);
      await refetch();
      onCountsRefresh?.();
      alert("Pathao courier এ order পাঠানো হয়েছে।");
    } catch (err) {
      alert(err.message || "Pathao courier এ পাঠানো যায়নি");
    } finally {
      setCourierBusyId(null);
    }
  }

  async function handleSyncSteadfastStatus(order) {
    setCourierBusyId(order.Id);
    try {
      await orderService.syncSteadfastStatus(order.Id);
      await refetch();
      onCountsRefresh?.();
    } catch (err) {
      alert(err.message || "Steadfast status sync failed");
    } finally {
      setCourierBusyId(null);
    }
  }

  async function handleSyncPathaoStatus(order) {
    setCourierBusyId(order.Id);
    try {
      await orderService.syncPathaoStatus(order.Id);
      await refetch();
      onCountsRefresh?.();
    } catch (err) {
      alert(err.message || "Pathao status sync failed");
    } finally {
      setCourierBusyId(null);
    }
  }

  function handleToggleOrderSelection(orderId) {
    const id = Number(orderId);
    setSelectedOrderIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }

  function handleToggleAllVisible() {
    setSelectedOrderIds((ids) => {
      if (allVisibleSelected)
        return ids.filter((id) => !visibleOrderIds.includes(id));
      return [...new Set([...ids, ...visibleOrderIds])];
    });
  }

  async function handleBulkSendToSteadfast() {
    const confirmedIds = selectedCourierOrderIds;
    if (!confirmedIds.length) {
      alert(
        "Selected orders এর মধ্যে courier এ পাঠানোর মতো confirmed order নেই",
      );
      return;
    }
    if (
      !window.confirm(
        `${confirmedIds.length} টি confirmed order Steadfast courier এ পাঠাবেন?`,
      )
    )
      return;
    setBulkCourierBusy(true);
    try {
      const res = await orderService.bulkSendToSteadfast(confirmedIds);
      const data = res.data || {};
      const sent = data.sent?.length || 0;
      const skipped = data.skipped?.length || 0;
      setSelectedOrderIds([]);
      await refetch();
      onCountsRefresh?.();
      alert(
        `Steadfast bulk send complete. Sent: ${sent}, Skipped/Error: ${skipped}`,
      );
    } catch (err) {
      alert(err.message || "Bulk send to Steadfast failed");
    } finally {
      setBulkCourierBusy(false);
    }
  }

  async function handleBulkSendToPathao() {
    const confirmedIds = selectedCourierOrderIds;
    if (!confirmedIds.length) {
      alert(
        "Selected orders এর মধ্যে courier এ পাঠানোর মতো confirmed order নেই",
      );
      return;
    }
    if (
      !window.confirm(
        `${confirmedIds.length} টি confirmed order Pathao courier এ পাঠাবেন?`,
      )
    )
      return;
    setBulkCourierBusy(true);
    try {
      const res = await orderService.bulkSendToPathao(confirmedIds);
      const data = res.data || {};
      const sent = data.sent?.length || 0;
      const skipped = data.skipped?.length || 0;
      setSelectedOrderIds([]);
      await refetch();
      onCountsRefresh?.();
      alert(
        `Pathao bulk send complete. Sent: ${sent}, Skipped/Error: ${skipped}`,
      );
    } catch (err) {
      alert(err.message || "Bulk send to Pathao failed");
    } finally {
      setBulkCourierBusy(false);
    }
  }

  function getSelectedOrders() {
    return selectedOrderIds
      .map((id) => orders.find((order) => Number(order.Id) === Number(id)))
      .filter(Boolean);
  }

  // Runs a bulk action for the selected orders, then reloads the list and status counts.
  async function runSelectedAction(key, action, { emptyMessage, confirmText } = {}) {
    if (!selectedOrderIds.length) {
      alert(emptyMessage || "আগে order select করুন");
      return;
    }
    if (confirmText && !window.confirm(confirmText)) return;
    setActionBusy(key);
    try {
      const message = await action();
      await refetch();
      onCountsRefresh?.();
      if (message) alert(message);
    } catch (err) {
      alert(err.message || "Action failed");
    } finally {
      setActionBusy("");
    }
  }

  function bulkResultMessage(res) {
    const data = res?.data || {};
    const failed = data.failed || [];
    return failed.length
      ? `${data.updated || 0} টি order update হয়েছে, ${failed.length} টি হয়নি:\n${failed
          .slice(0, 5)
          .map((item) => `#${item.id}: ${item.message}`)
          .join("\n")}`
      : `${data.updated || 0} টি order update হয়েছে`;
  }

  function handleBulkChangeStatus() {
    if (!bulkStatus) return alert("Status select করুন");
    return runSelectedAction("status", async () =>
      bulkResultMessage(
        await orderService.bulkAction(selectedOrderIds, "status", bulkStatus),
      ),
    );
  }

  function handleBulkOrderTag() {
    if (!bulkOrderTag) return alert("Tag select করুন");
    return runSelectedAction("order_tag", async () =>
      bulkResultMessage(
        await orderService.bulkAction(selectedOrderIds, "order_tag", bulkOrderTag),
      ),
    );
  }

  function handleBulkCustomerTag() {
    if (!bulkCustomerTag) return alert("Customer tag select করুন");
    return runSelectedAction(
      "customer_tag",
      async () =>
        bulkResultMessage(
          await orderService.bulkAction(selectedOrderIds, "customer_tag", bulkCustomerTag),
        ),
      { confirmText: "Customer tag ঐ customer এর সব order এ লাগবে। Continue?" },
    );
  }

  function handleDeleteSelectedNotes() {
    return runSelectedAction(
      "delete_notes",
      async () =>
        bulkResultMessage(await orderService.bulkAction(selectedOrderIds, "delete_notes")),
      { confirmText: `${selectedOrderIds.length} টি order এর সব note মুছে ফেলবেন?` },
    );
  }

  function handleCourierUnlink() {
    return runSelectedAction(
      "courier_unlink",
      async () =>
        bulkResultMessage(await orderService.bulkAction(selectedOrderIds, "courier_unlink")),
      {
        confirmText:
          "Selected order গুলো থেকে courier link (consignment) সরিয়ে দেবেন? Courier এর parcel নিজে cancel হবে না।",
      },
    );
  }

  function handleUpdateCourierStatus() {
    return runSelectedAction("courier_status", async () => {
      const targets = getSelectedOrders().filter(
        (order) => getSteadfastInfo(order).consignmentId || getSteadfastInfo(order).trackingCode || getPathaoInfo(order).consignmentId,
      );
      if (!targets.length) return "Selected order গুলোর কোনোটি courier এ booked নয়";
      let synced = 0;
      const failed = [];
      for (const order of targets) {
        try {
          if (getPathaoInfo(order).consignmentId) await orderService.syncPathaoStatus(order.Id);
          else await orderService.syncSteadfastStatus(order.Id);
          synced += 1;
        } catch (err) {
          failed.push(`${order.orderId}: ${err.message}`);
        }
      }
      return `${synced} টি order এর courier status update হয়েছে${failed.length ? `\nFailed:\n${failed.slice(0, 5).join("\n")}` : ""}`;
    });
  }

  function handleReturnRequest() {
    const targets = getSelectedOrders().filter(
      (order) => getSteadfastInfo(order).consignmentId || getSteadfastInfo(order).trackingCode,
    );
    if (selectedOrderIds.length && !targets.length) {
      alert("Return request শুধু Steadfast এ booked order এর জন্য করা যায়");
      return;
    }
    const reason = selectedOrderIds.length ? window.prompt("Return এর কারণ লিখুন") : "";
    if (reason === null) return;
    return runSelectedAction("return_request", async () => {
      let sent = 0;
      const failed = [];
      for (const order of targets) {
        try {
          await orderService.createSteadfastReturn(order.Id, reason);
          sent += 1;
        } catch (err) {
          failed.push(`${order.orderId}: ${err.message}`);
        }
      }
      return `${sent} টি return request পাঠানো হয়েছে${failed.length ? `\nFailed:\n${failed.slice(0, 5).join("\n")}` : ""}`;
    });
  }

  function handleSendSms() {
    if (!selectedOrderIds.length) {
      alert("SMS পাঠানোর জন্য আগে order select করুন");
      return;
    }
    const smsText = window.prompt(`${selectedOrderIds.length} টি order এর customer কে SMS:`);
    if (!smsText?.trim()) return;
    return runSelectedAction("sms", async () => {
      const res = await orderService.sendSms(selectedOrderIds, smsText.trim());
      return res.data?.message || res.message || "SMS পাঠানো হয়েছে";
    });
  }

  async function handleExportSelected() {
    if (!selectedOrderIds.length) {
      alert("Export করার জন্য আগে order select করুন");
      return;
    }
    setActionBusy("export");
    try {
      const res = await orderService.getReport("export", {
        orderIds: selectedOrderIds.join(","),
      });
      const report = res.data || {};
      downloadCsv(
        `selected-orders-${new Date().toISOString().slice(0, 10)}.csv`,
        report.columns || [],
        report.rows || [],
      );
    } catch (err) {
      alert(err.message || "Export failed");
    } finally {
      setActionBusy("");
    }
  }

  // Recorded for the "Print Status" filter; a failure here must not block printing.
  function markOrdersPrinted(printedOrders) {
    orderService
      .markPrinted(printedOrders.map((order) => order.Id))
      .catch(() => {});
  }

  function handlePrintSelectedBarcodes() {
    const selectedOrders = selectedOrderIds
      .map((id) => orders.find((order) => Number(order.Id) === Number(id)))
      .filter(Boolean);

    if (!selectedOrders.length) {
      alert("Barcode print করার জন্য আগে order select করুন");
      return;
    }

    setBarcodePrintOrders(selectedOrders);
    markOrdersPrinted(selectedOrders);
  }

  function handlePrintSelectedInvoices() {
    const selectedOrders = selectedOrderIds
      .map((id) => orders.find((order) => Number(order.Id) === Number(id)))
      .filter(Boolean);

    if (!selectedOrders.length) {
      alert("Invoice print করার জন্য আগে order select করুন");
      return;
    }

    setInvoicePrintOrders(selectedOrders);
    markOrdersPrinted(selectedOrders);
  }

  function handlePrintSelectedStickers() {
    const selectedOrders = selectedOrderIds
      .map((id) => orders.find((order) => Number(order.Id) === Number(id)))
      .filter(Boolean);

    if (!selectedOrders.length) {
      alert("Sticker print করার জন্য আগে order select করুন");
      return;
    }

    setStickerPrintOrders(selectedOrders);
    markOrdersPrinted(selectedOrders);
  }

  async function handlePrintSelectedItemList() {
    const selectedOrders = selectedOrderIds
      .map((id) => orders.find((order) => Number(order.Id) === Number(id)))
      .filter(Boolean);

    if (!selectedOrders.length) {
      alert("Item order list print করার জন্য আগে order select করুন");
      return;
    }

    // Current variant stock for the "Stock Status" column, keyed by variation Id.
    const productIds = [
      ...new Set(
        selectedOrders.flatMap((order) =>
          getItemListLines(order).map((line) => line.productId).filter(Boolean),
        ),
      ),
    ];
    const products = await Promise.all(
      productIds.map((id) =>
        productService
          .getById(id)
          .then((res) => res?.data || null)
          .catch(() => null),
      ),
    );
    const variations = {};
    products.filter(Boolean).forEach((product) => {
      (product.variations || []).forEach((variation) => {
        variations[variation.Id] = variation;
      });
    });

    setItemListVariations(variations);
    setItemListPrintOrders(selectedOrders);
    markOrdersPrinted(selectedOrders);
  }

  async function handleAssignSelectedOrders() {
    setAssignError("");
    if (!selectedOrderIds.length) {
      setAssignError("Assign করার জন্য আগে order select করুন");
      return;
    }
    if (!selectedEmployeeId) {
      setAssignError("Assign To থেকে user select করুন");
      return;
    }
    const employee = assignees.find(
      (item) => String(item.Id) === String(selectedEmployeeId),
    );
    if (
      !window.confirm(
        `${selectedOrderIds.length} টি order ${employee?.name || "selected employee"} কে assign করবেন?`,
      )
    )
      return;
    setAssignBusy(true);
    try {
      try {
        await orderService.bulkAssign(selectedOrderIds, selectedEmployeeId);
      } catch (err) {
        if (
          !/api not found|not found|cannot\s+(post|put)/i.test(
            err.message || "",
          )
        ) {
          throw err;
        }
        const assignedByName = getEmployeeName(user);
        await Promise.all(
          selectedOrderIds.map((id) =>
            orderService.updateOrder(id, {
              assignedEmployeeId: selectedEmployeeId,
              assignedEmployeeName: employee?.name || "",
              assignedById: user?.Id || user?.id || null,
              assignedByName,
              assignedAt: new Date().toISOString(),
            }),
          ),
        );
      }
      setSelectedOrderIds([]);
      await refetch();
      onCountsRefresh?.();
      setAssignError("");
    } catch (err) {
      setAssignError(err.message || "Order assign failed");
    } finally {
      setAssignBusy(false);
    }
  }

  async function openFraudCheck(order, refresh = false) {
    setFraudCheckOrder(order);
    setFraudCheckLoading(true);
    setFraudCheckError("");
    try {
      const res = await orderService.getFraudCheck(order.Id, {
        refresh: refresh ? 1 : undefined,
      });
      setFraudCheckData(res.data || null);
    } catch (err) {
      setFraudCheckError(err.message || "Fraud check failed");
      setFraudCheckData(null);
    } finally {
      setFraudCheckLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil((meta?.total || 0) / pageSize));
  const firstShown = Math.min((page - 1) * pageSize + 1, meta?.total || 0);
  const lastShown = Math.min(page * pageSize, meta?.total || 0);
  const statusColors = {
    ...Object.fromEntries(orderStatuses.map((item) => [item.key, item.color])),
    [RETURN_RECEIVED_STATUS.key]: RETURN_RECEIVED_STATUS.color,
  };
  const currentStatus = activeStatus || "all";
  const tableColumnCount = 11;
  const statusMaps = useMemo(
    () => buildStatusMaps(orderStatuses),
    [orderStatuses],
  );
  const statusLabels = {
    ...statusMaps.labels,
    [RETURN_RECEIVED_STATUS.key]: RETURN_RECEIVED_STATUS.label,
  };
  const tabStatuses = useMemo(
    () => ["all", ...statusMaps.statuses.map((s) => s.key)],
    [statusMaps.statuses],
  );
  const sameDayDuplicateOrderIds = useMemo(
    () => getSameDayDuplicateOrderIds(orders),
    [orders],
  );

  useEffect(() => {
    let mounted = true;
    orderStatusService
      .getAll({ limit: 100 })
      .then((res) => {
        if (mounted) setOrderStatuses(normalizeOrderStatuses(res.data || []));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Status tab filter */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1.5 flex-wrap">
        {tabStatuses.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusClick(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition whitespace-nowrap ${
              currentStatus === s
                ? "text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={
              currentStatus === s
                ? {
                    backgroundColor:
                      s === "all"
                        ? "#06b6d4"
                        : orderStatuses.find((item) => item.key === s)?.color,
                  }
                : undefined
            }
          >
            {statusMaps.labels[s] || s}
            <span className="ml-1 opacity-80">({statusCounts[s] ?? 0})</span>
          </button>
        ))}
        <button
          onClick={onCreateOrder}
          className="ml-auto flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition"
        >
          <Plus size={13} />
          Create Order
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Search & Filter */}
        <div className="rounded-xl bg-white p-3 shadow">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilterPanel((open) => !open)}
              className={`inline-flex h-9 items-center justify-center gap-1 rounded-lg px-3 text-xs font-medium transition ${
                showFilterPanel || activeAdvancedFilterCount
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <SlidersHorizontal size={13} />
              Filter
              {activeAdvancedFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 text-[10px] text-white">
                  {activeAdvancedFilterCount}
                </span>
              )}
              <ChevronDown
                size={13}
                className={`transition ${showFilterPanel ? "rotate-180" : ""}`}
              />
            </button>

            <button
              onClick={handleResetFilters}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 text-xs text-gray-600 transition hover:bg-gray-200"
              title="Reset filters"
            >
              <RefreshCw size={13} />
            </button>

            <input
              type="text"
              placeholder="ফোন / নাম / অর্ডার ID / IP"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9 w-full min-w-0 rounded-lg border border-gray-200 px-3 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-72"
            />

            <div className="ml-auto text-xs text-gray-500">
              Total:{" "}
              <span className="font-semibold text-gray-800">
                {meta?.total ?? 0}
              </span>{" "}
              orders
            </div>
          </div>

          {showFilterPanel && (
            <OrderFilterPanel
              filters={advancedFilters}
              onChange={setAdvancedFilters}
              onApply={handleSearch}
              onClear={handleClearAdvancedFilters}
              employeeValue={employeeFilter}
              employeeOptions={canAssignOrders ? employeeFilterOptions : null}
              onEmployeeChange={handleEmployeeFilterChange}
              onReport={handleReport}
              exporting={exporting}
              leadingFields={
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      Date Range
                    </label>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-9 min-w-0 rounded-lg border border-gray-200 px-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-9 min-w-0 rounded-lg border border-gray-200 px-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  </div>

                  <SearchableSelect
                    label="Status"
                    value={currentStatus}
                    options={tabStatuses.map((s) => ({
                      value: s,
                      label: statusMaps.labels[s] || s,
                    }))}
                    onChange={handlePanelStatusChange}
                  />
                </>
              }
            />
          )}
        </div>

        {statusWiseParams ? (
          <OrderItemsReport
            statusWise
            filterParams={statusWiseParams}
            statuses={[...orderStatuses, RETURN_RECEIVED_STATUS]}
            onClose={() => setStatusWiseParams(null)}
          />
        ) : (
        <>
        {/* Table */}
        <div className="rounded-xl bg-white shadow">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
              Order List
              {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
            </h2>
            <div className="flex h-9 w-full max-w-[260px] items-center rounded border border-gray-200">
              <span className="border-r border-gray-200 px-2.5 text-sm text-gray-500">ID</span>
              <input
                type="text"
                placeholder="Search by Only ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-full min-w-0 flex-1 rounded-r px-2.5 text-sm text-gray-600 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3 text-sm text-gray-600">
            <PageSizeSelect value={pageSize} onChange={handlePageSizeChange} />
            <label className="flex items-center gap-2">
              Search:
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="নাম / ফোন / IP"
                className="h-8 w-44 rounded border border-gray-200 px-2.5 text-sm outline-none focus:border-teal-500"
              />
            </label>
          </div>
          <div className="px-4 pb-2 pt-2 text-sm text-gray-500">
            Showing {firstShown} to {lastShown} of {meta?.total || 0} entries
          </div>

          {error && (
            <div className="mx-4 mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              Error: {error}
            </div>
          )}

          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[1500px] border border-gray-200 text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Status</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleAllVisible}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      title="Select all visible orders"
                    />
                  </th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Source</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Notes</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">ID &amp; Products</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Name &amp; Number</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Date</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Address</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Courier</th>
                  <th className="border-r border-gray-200 px-2 py-2.5 text-left font-semibold">Summary</th>
                  <th className="px-2 py-2.5 text-left font-semibold">Employee</th>
                </tr>
              </thead>
              <tbody>
                {loading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumnCount} className="py-12 text-center text-gray-400">
                      <Loader2 size={20} className="mr-2 inline animate-spin" />
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumnCount} className="py-12 text-center text-gray-400">
                      কোনো অর্ডার পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  orders.map((order, idx) => (
                    <OrderRow
                      key={order.Id}
                      order={order}
                      index={(page - 1) * pageSize + idx + 1}
                      onView={() => onViewOrder && onViewOrder(order)}
                      onEdit={() => onEditOrder && onEditOrder(order)}
                      onPrintOrder={() => onPrintOrder && onPrintOrder(order)}
                      onDelete={() => handleDelete(order.Id)}
                      onBlockIp={() => handleBlockIp(order)}
                      onToggleFraudStatus={() => handleToggleFraudStatus(order)}
                      onProductInfo={() => setProductInfoOrder(order)}
                      onFraudCheck={() => openFraudCheck(order)}
                      onCustomerProfile={() => onViewCustomer?.(order)}
                      onAddNote={() => setNoteModal({ order, mode: "add" })}
                      onShowNotes={() => setNoteModal({ order, mode: "show" })}
                      onSourceChange={(source) =>
                        handleSaveOrderSource(order, source)
                      }
                      onStatusChange={(status) =>
                        handleTableStatusChange(order, status)
                      }
                      statusOptions={getTableStatusOptions(currentStatus)}
                      onSendToSteadfast={() => handleSendToSteadfast(order)}
                      onSendToPathao={() => handleSendToPathao(order)}
                      onSyncSteadfastStatus={() =>
                        handleSyncSteadfastStatus(order)
                      }
                      onSyncPathaoStatus={() => handleSyncPathaoStatus(order)}
                      courierBusy={courierBusyId === order.Id}
                      selected={selectedOrderIds.includes(Number(order.Id))}
                      onSelect={() => handleToggleOrderSelection(order.Id)}
                      isSameDayDuplicate={sameDayDuplicateOrderIds.has(
                        order.Id,
                      )}
                      statusLabels={statusLabels}
                      statusColors={statusColors}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-gray-500">
            <div className="space-y-2">
              <div>
                Showing {firstShown} to {lastShown} of {meta?.total || 0} entries
              </div>
              <PageSizeSelect value={pageSize} onChange={handlePageSizeChange} />
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>

        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="rounded-xl bg-white shadow">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-800">Action</h2>
                <span className="text-xs text-gray-500">
                  Selected:{" "}
                  <span className="font-semibold text-gray-800">
                    {selectedOrderIds.length}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 px-4 pt-4">
                <ActionButton color="bg-green-600" icon={<Printer size={13} />} onClick={handlePrintSelectedInvoices}>
                  Print Selected
                </ActionButton>
                <ActionButton color="bg-teal-600" icon={<Printer size={13} />} onClick={handlePrintSelectedBarcodes}>
                  Print Barcode
                </ActionButton>
                <ActionButton color="bg-teal-600" icon={<ClipboardList size={13} />} onClick={handlePrintSelectedItemList}>
                  Print Item List
                </ActionButton>
                <ActionButton color="bg-teal-600" icon={<StickyNote size={13} />} onClick={handlePrintSelectedStickers}>
                  Print Sticker
                </ActionButton>
                <ActionButton color="bg-teal-600" icon={<Download size={13} />} onClick={handleExportSelected} busy={actionBusy === "export"}>
                  Export
                </ActionButton>
                <ActionButton color="bg-teal-600" icon={<RefreshCw size={13} />} onClick={handleUpdateCourierStatus} busy={actionBusy === "courier_status"}>
                  Update Courier Status
                </ActionButton>
                <ActionButton color="bg-teal-600" icon={<MessageCircle size={13} />} onClick={handleSendSms} busy={actionBusy === "sms"}>
                  Send SMS
                </ActionButton>
                <ActionButton color="bg-red-500" icon={<Trash2 size={13} />} onClick={handleDeleteSelectedNotes} busy={actionBusy === "delete_notes"}>
                  Delete Notes
                </ActionButton>
                <ActionButton color="bg-blue-600" icon={<Truck size={13} />} onClick={handleBulkSendToSteadfast} busy={bulkCourierBusy}>
                  Steadfast ({selectedCourierOrderIds.length})
                </ActionButton>
                <ActionButton color="bg-emerald-600" icon={<Truck size={13} />} onClick={handleBulkSendToPathao} busy={bulkCourierBusy}>
                  Pathao ({selectedCourierOrderIds.length})
                </ActionButton>
                <ActionButton color="bg-red-500" icon={<X size={13} />} onClick={handleCourierUnlink} busy={actionBusy === "courier_unlink"}>
                  Courier Unlink
                </ActionButton>
                <ActionButton color="bg-red-500" icon={<RotateCcw size={13} />} onClick={handleReturnRequest} busy={actionBusy === "return_request"}>
                  Return Request
                </ActionButton>
              </div>

              <div className="grid gap-4 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
                {canAssignOrders && (
                  <ActionField
                    label="Assign To*"
                    buttonLabel="Assign Selected"
                    onSubmit={handleAssignSelectedOrders}
                    busy={assignBusy}
                    error={assignError}
                  >
                    <select
                      value={selectedEmployeeId}
                      onChange={(event) => {
                        setSelectedEmployeeId(event.target.value);
                        setAssignError("");
                      }}
                      className={ACTION_SELECT_CLASS}
                    >
                      <option value="">Select User</option>
                      {assignees.map((employee) => (
                        <option key={employee.Id} value={employee.Id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </ActionField>
                )}

                <ActionField
                  label="Change Status*"
                  buttonLabel="Change Selected"
                  onSubmit={handleBulkChangeStatus}
                  busy={actionBusy === "status"}
                >
                  <select
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value)}
                    className={ACTION_SELECT_CLASS}
                  >
                    <option value="">Select Status</option>
                    {statusMaps.statuses.map((item) => (
                      <option key={item.key} value={item.key}>
                        {statusMaps.labels[item.key] || item.key}
                      </option>
                    ))}
                  </select>
                </ActionField>

                <ActionField
                  label="Assign Tag*"
                  buttonLabel="Change Selected"
                  onSubmit={handleBulkOrderTag}
                  busy={actionBusy === "order_tag"}
                >
                  <select
                    value={bulkOrderTag}
                    onChange={(event) => setBulkOrderTag(event.target.value)}
                    className={ACTION_SELECT_CLASS}
                  >
                    <option value="">Select Tag</option>
                    {ORDER_TAG_OPTIONS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag.replace(/\b\w/g, (char) => char.toUpperCase())}
                      </option>
                    ))}
                    <option value="none">Remove Tag</option>
                  </select>
                </ActionField>

                <ActionField
                  label="Assign Customer Tag*"
                  buttonLabel="Change Selected"
                  onSubmit={handleBulkCustomerTag}
                  busy={actionBusy === "customer_tag"}
                >
                  <select
                    value={bulkCustomerTag}
                    onChange={(event) => setBulkCustomerTag(event.target.value)}
                    className={ACTION_SELECT_CLASS}
                  >
                    <option value="">Select Tag</option>
                    <option value="safe">Safe</option>
                    <option value="fake">Fake</option>
                    <option value="none">Remove Tag</option>
                  </select>
                </ActionField>
              </div>
            </div>

            <SalesSummaryCard filterParams={appliedFilterParams} />
          </div>

          <SelectionSummaryCard
            orders={selectedOrderIds.length ? getSelectedOrders() : orders}
            selectedCount={selectedOrderIds.length}
          />
        </div>
        </>
        )}
      </div>

      {packingParams && (
        <OrderItemsReport
          filterParams={packingParams}
          onClose={() => setPackingParams(null)}
        />
      )}

      {reportModal && (
        <OrderReportModal
          title={reportModal.title}
          report={reportModal.report}
          loading={reportModal.loading}
          error={reportModal.error}
          onClose={() => setReportModal(null)}
        />
      )}

      {productInfoOrder && (
        <ProductInfoModal
          order={productInfoOrder}
          onClose={() => setProductInfoOrder(null)}
        />
      )}

      {fraudCheckOrder && (
        <FraudCheckModal
          order={fraudCheckOrder}
          data={fraudCheckData}
          loading={fraudCheckLoading}
          error={fraudCheckError}
          onRefresh={() => openFraudCheck(fraudCheckOrder, true)}
          onClose={() => {
            setFraudCheckOrder(null);
            setFraudCheckData(null);
            setFraudCheckError("");
          }}
        />
      )}

      {noteModal && (
        <OrderNoteModal
          order={noteModal.order}
          mode={noteModal.mode}
          onSave={handleSaveOrderNote}
          onReplaceNotes={handleReplaceOrderNotes}
          onClose={() => setNoteModal(null)}
        />
      )}

      {barcodePrintOrders.length > 0 && (
        <OrderBarcodePrintSheet orders={barcodePrintOrders} />
      )}

      {invoicePrintOrders.length > 0 && (
        <OrderInvoicePrintSheet
          orders={invoicePrintOrders}
          siteSettings={siteSettings}
        />
      )}

      {itemListPrintOrders.length > 0 && (
        <OrderItemListPrintSheet
          orders={itemListPrintOrders}
          variations={itemListVariations}
          siteSettings={siteSettings}
        />
      )}

      {stickerPrintOrders.length > 0 && (
        <OrderStickerPrintSheet
          orders={stickerPrintOrders}
          siteSettings={siteSettings}
        />
      )}
    </div>
  );
}

// 75mm × 50mm parcel sticker, one per order.
function OrderStickerPrintSheet({ orders, siteSettings }) {
  const settings = normalizeSettingData(siteSettings);
  const shopName = getSiteName(settings) || settings.companyName || "Khilgaon Mart";
  const shopPhone = settings.phone || settings.phoneNumber || "";

  return (
    <div className="order-sticker-print-area">
      <div className="order-sticker-print-toolbar">
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      {orders.map((order) => (
        <OrderSticker
          key={order.Id}
          order={order}
          shopName={shopName}
          shopPhone={shopPhone}
        />
      ))}

      <style>{`
        .order-sticker-print-area {
          display: none;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .order-sticker-print-toolbar {
          padding: 12px;
          text-align: center;
        }

        .order-sticker-print-toolbar button {
          border: 1px solid #111827;
          border-radius: 4px;
          background: #ffffff;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
        }

        .order-sticker {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          width: 75mm;
          height: 50mm;
          margin: 0 auto 8px;
          padding: 2mm 2.5mm;
          overflow: hidden;
          border: 1px dashed #9ca3af;
          background: #ffffff;
          color: #000000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 7.5pt;
          line-height: 1.25;
          break-after: page;
          page-break-after: always;
        }

        .order-sticker:last-child {
          break-after: auto;
          page-break-after: auto;
        }

        .order-sticker p {
          margin: 0;
        }

        .order-sticker__head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 2mm;
          border-bottom: 0.3mm solid #000000;
          padding-bottom: 0.8mm;
        }

        .order-sticker__shop {
          font-size: 9pt;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-sticker__barcode {
          display: flex;
          align-items: center;
          gap: 2mm;
          margin-top: 1mm;
        }

        .order-sticker__barcode svg {
          display: block;
          width: 40mm;
          height: 8mm;
        }

        .order-sticker__invoice {
          font-size: 9pt;
          font-weight: 700;
        }

        .order-sticker__to {
          margin-top: 1mm;
        }

        .order-sticker__name {
          font-size: 9pt;
          font-weight: 700;
        }

        .order-sticker__clamp {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }

        .order-sticker__items {
          flex: 1 1 auto;
          min-height: 0;
          margin-top: 0.8mm;
          overflow: hidden;
          font-size: 6.5pt;
          line-height: 1.2;
        }

        .order-sticker__items--sm {
          font-size: 5.5pt;
        }

        .order-sticker__items--xs {
          font-size: 4.8pt;
        }

        .order-sticker__foot {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
          border-top: 0.3mm solid #000000;
          padding-top: 0.8mm;
        }

        .order-sticker__cod {
          font-size: 11pt;
          font-weight: 700;
        }

        @media print {
          @page {
            size: 75mm 50mm;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          body * {
            visibility: hidden !important;
          }

          .order-sticker-print-area,
          .order-sticker-print-area * {
            visibility: visible !important;
          }

          .order-sticker-print-area {
            display: block !important;
            position: absolute;
            inset: 0;
            background: #ffffff;
          }

          .order-sticker-print-toolbar {
            display: none !important;
          }

          .order-sticker {
            margin: 0;
            border: none;
          }
        }
      `}</style>
    </div>
  );
}

function OrderSticker({ order, shopName, shopPhone }) {
  const meta = getOrderNoteMeta(order);
  const code = formatInvoiceNumber(order, "N/A");
  const bars = buildBarcodeBars(code);
  const barcodeWidth = bars.reduce((sum, bar) => sum + bar.width, 0);
  const address =
    order.customerAddress ||
    meta.customerAddress ||
    [order.customerArea, order.customerDistrict].filter(Boolean).join(", ");
  const items = getInvoiceItems(order, meta)
    .map((line) => `${line.name} [Product ID: ${line.productId ?? "N/A"}] ×${line.qty} — ৳${line.unitPrice.toLocaleString("en-US")}`)
    .join(", ");
  // Every item must fit on the fixed-size sticker, so long lists get a smaller font.
  const itemsSizeClass =
    items.length > 220
      ? "order-sticker__items--xs"
      : items.length > 120
        ? "order-sticker__items--sm"
        : "";
  const total = Number(order.totalBill || order.total || meta.total || 0);
  const paid = Number(order.advance || order.paid || meta.advance || meta.paid || 0);
  const due = Math.max(0, total - paid);
  const orderDate = order.orderDate || order.createdAt || meta.orderDate;

  return (
    <div className="order-sticker">
      <div className="order-sticker__head">
        <p className="order-sticker__shop">{shopName}</p>
        {shopPhone && <p>{shopPhone}</p>}
      </div>

      <div className="order-sticker__barcode">
        <svg
          viewBox={`0 0 ${barcodeWidth} 60`}
          preserveAspectRatio="none"
          aria-label={`Barcode ${code}`}
        >
          <rect width={barcodeWidth} height="60" fill="#ffffff" />
          {bars.reduce(
            (acc, bar, index) => {
              const x = acc.offset;
              acc.offset += bar.width;
              if (bar.black) {
                acc.nodes.push(
                  <rect key={`${x}-${index}`} x={x} y="0" width={bar.width} height="60" fill="#000000" />,
                );
              }
              return acc;
            },
            { offset: 0, nodes: [] },
          ).nodes}
        </svg>
        <p className="order-sticker__invoice">{code}</p>
      </div>

      <div className="order-sticker__to">
        <p className="order-sticker__name">{order.customerName || "Customer"}</p>
        <p>{order.customerPhone || ""}</p>
        <p className="order-sticker__clamp">{address}</p>
      </div>

      <p className={`order-sticker__items ${itemsSizeClass}`}>{items}</p>

      <div className="order-sticker__foot">
        <p>{orderDate ? new Date(orderDate).toLocaleDateString("en-GB") : ""}</p>
        <p className="order-sticker__cod">COD: ৳{due.toLocaleString("en-US")}</p>
      </div>
    </div>
  );
}

// Order lines for the item list: product and variant kept apart.
function getItemListLines(order) {
  const meta = getOrderNoteMeta(order);
  const items = Array.isArray(meta.items) ? meta.items : [];
  if (!items.length) {
    return [{
      productId: null,
      variantId: null,
      name: order.productName || "Product",
      variant: "",
      qty: Number(order.quantity || 1) || 1,
      image: order.productImage || "",
    }];
  }
  return items.map((item) => ({
    productId: Number(item.id || item.productId) || null,
    variantId: Number(item.variantId) || null,
    name: item.name || item.productName || "Product",
    variant: item.variant || "",
    qty: Number(item.qty || item.quantity || 1) || 1,
    image: getInvoiceItemImage(item),
  }));
}

// Variant stock already has these orders taken out, so stock >= 0 means
// every held order can be packed; below zero the variant is short. The
// shortage is variant-wide, so a row never shows more short than its own qty.
function getItemStockStatus(variation, qty) {
  if (!variation) return "—";
  if (variation.availability === "out of stock") return "Unavailable";
  const stock = Number(variation.stock || 0);
  if (stock >= 0) return "In Stock";
  const short = Math.min(-stock, qty);
  return variation.preOrder ? `Pre Order (${short} short)` : `Short ${short}`;
}

function ItemListImage({ src }) {
  return (
    <div className="order-itemlist-img">
      {src ? (
        <img
          src={imageUrl(src)}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        "IMG"
      )}
    </div>
  );
}

function OrderItemListPrintSheet({ orders, variations, siteSettings }) {
  const settings = normalizeSettingData(siteSettings);
  const shopName = getSiteName(settings) || settings.companyName || "Khilgaon Mart";
  const shopAddress = settings.address || "Khilgaon, Dhaka";
  const shopPhone = settings.phone || settings.phoneNumber || "";

  const orderGroups = orders
    .map((order) => ({ order, lines: getItemListLines(order) }))
    .filter((group) => group.lines.length > 0);
  const details = orderGroups.flatMap(({ order, lines }) =>
    lines.map((line) => ({ ...line, order })),
  );

  // Summary: the same product + variant across orders merged into one row.
  const summary = [];
  const byKey = new Map();
  details.forEach((line) => {
    const key = line.variantId
      ? `v${line.variantId}`
      : `${line.name}|${line.variant}`.toLowerCase();
    const row = byKey.get(key);
    if (row) {
      row.qty += line.qty;
      return;
    }
    const next = { ...line, key };
    byKey.set(key, next);
    summary.push(next);
  });

  return (
    <div className="order-itemlist-print-area">
      <div className="order-itemlist-print-toolbar">
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="order-itemlist-page">
        <div className="order-itemlist-shop">
          <div className="name">{shopName}</div>
          <div>Address: {shopAddress}</div>
          {shopPhone && <div>Phone: {shopPhone}</div>}
        </div>

        <p className="order-itemlist-caption">This table is Item Order List Summary:</p>
        <table className="order-itemlist-table">
          <thead>
            <tr>
              <th>Serial No</th>
              <th>Image</th>
              <th>Product Name</th>
              <th>Product Variation Name</th>
              <th>Qty</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, index) => (
              <tr key={row.key}>
                <td className="center">{index + 1}</td>
                <td className="center"><ItemListImage src={row.image} /></td>
                <td>{row.name}</td>
                <td>{row.variant || "—"}</td>
                <td className="center qty">{row.qty}</td>
                <td className="center">{getItemStockStatus(variations[row.variantId], row.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="order-itemlist-caption">This table is Item Order List Details:</p>
        <table className="order-itemlist-table">
          <thead>
            <tr>
              <th>Serial No</th>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Image</th>
              <th>Product Name</th>
              <th>Product Variation Name</th>
              <th>Qty</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {orderGroups.flatMap(({ order, lines }, orderIndex) =>
              lines.map((line, lineIndex) => (
              <tr key={`${order.Id}-${lineIndex}`}>
                {/* One order = one serial; customer cells span all its items. */}
                {lineIndex === 0 && (
                  <>
                    <td className="center" rowSpan={lines.length}>{orderIndex + 1}</td>
                    <td rowSpan={lines.length}>{order.customerName || "—"}</td>
                    <td rowSpan={lines.length}>{order.customerPhone || "—"}</td>
                  </>
                )}
                <td className="center"><ItemListImage src={line.image} /></td>
                <td>{line.name}</td>
                <td>{line.variant || "—"}</td>
                <td className="center qty">{line.qty}</td>
                <td className="center">{getItemStockStatus(variations[line.variantId], line.qty)}</td>
              </tr>
              )),
            )}
          </tbody>
        </table>

        <p className="order-itemlist-thanks">Thanks for print this</p>
      </div>

      <style>{`
        .order-itemlist-print-area {
          display: none;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .order-itemlist-print-toolbar {
          padding: 12px;
          text-align: center;
        }

        .order-itemlist-print-toolbar button {
          border: 1px solid #111827;
          border-radius: 4px;
          background: #ffffff;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
        }

        .order-itemlist-page {
          width: 760px;
          margin: 0 auto;
          background: #ffffff;
          padding: 28px 32px;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
        }

        .order-itemlist-shop {
          text-align: center;
          font-size: 16px;
          line-height: 1.4;
        }

        .order-itemlist-shop .name {
          font-size: 18px;
        }

        .order-itemlist-caption {
          margin: 28px 0 10px;
          font-size: 13px;
        }

        .order-itemlist-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .order-itemlist-table th,
        .order-itemlist-table td {
          border: 1px solid #111827;
          padding: 6px 8px;
          vertical-align: middle;
        }

        .order-itemlist-table th {
          font-weight: 400;
          text-align: center;
          vertical-align: top;
        }

        .order-itemlist-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .order-itemlist-table .center {
          text-align: center;
        }

        .order-itemlist-table .qty {
          font-weight: 700;
        }

        .order-itemlist-img {
          display: inline-flex;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #f3f4f6;
          background: #f9fafb;
          color: #d1d5db;
          font-size: 9px;
        }

        .order-itemlist-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-itemlist-thanks {
          margin: 48px 0 0;
          text-align: center;
          font-size: 13px;
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body * {
            visibility: hidden !important;
          }

          .order-itemlist-print-area,
          .order-itemlist-print-area * {
            visibility: visible !important;
          }

          .order-itemlist-print-area {
            display: block !important;
            position: absolute;
            inset: 0;
            background: #ffffff;
          }

          .order-itemlist-print-toolbar {
            display: none !important;
          }

          .order-itemlist-page {
            width: auto;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

function parseOrderNote(note) {
  if (!note || typeof note !== "string") return null;
  try {
    return JSON.parse(note);
  } catch {
    return null;
  }
}

function OrderBarcodePrintSheet({ orders }) {
  return (
    <div className="order-barcode-print-area">
      <div className="order-barcode-print-toolbar">
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="order-barcode-print-sheet">
        {orders.map((order) => (
          <OrderBarcodeLabel key={order.Id} order={order} />
        ))}
      </div>

      <style>{`
        .order-barcode-print-area {
          display: none;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .order-barcode-print-toolbar {
          padding: 12px;
          text-align: center;
        }

        .order-barcode-print-toolbar button {
          border: 1px solid #111827;
          border-radius: 4px;
          background: #ffffff;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
        }

        .order-barcode-print-sheet {
          display: block;
          background: #ffffff;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
        }

        .order-barcode-label {
          position: relative;
          height: 277mm;
          break-after: page;
          page-break-after: always;
          text-align: center;
        }

        .order-barcode-label:last-child {
          break-after: auto;
          page-break-after: auto;
        }

        .order-barcode-label__date {
          position: absolute;
          left: 9mm;
          top: 7mm;
          margin: 0;
          font-size: 7px;
          font-weight: 500;
        }

        .order-barcode-label__content {
          width: 82mm;
          margin: 7mm auto 0;
          min-height: 40mm;
          text-align: center;
        }

        .order-barcode-label__title {
          margin: 0;
          font-size: 8px;
          font-weight: 700;
        }

        .order-barcode-label__code {
          margin: 0.45mm 0 0;
          font-size: 8.5px;
          font-weight: 700;
        }

        .order-barcode-label__text {
          margin: 0.25mm 0 0;
          font-size: 8px;
          font-weight: 700;
          line-height: 1.05;
        }

        .order-barcode-label__barcode {
          display: block;
          width: 38mm;
          height: 11mm;
          overflow: hidden;
          margin: 2.2mm auto 0;
        }

        .order-barcode-label__barcode svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .order-barcode-label__number {
          margin: 0.4mm 0 0;
          font-size: 7.5px;
          font-weight: 700;
        }

        @media print {
          @page {
            margin: 0;
          }

          body * {
            visibility: hidden !important;
          }

          .order-barcode-print-area,
          .order-barcode-print-area * {
            visibility: visible !important;
          }

          .order-barcode-print-area {
            display: block !important;
            position: absolute;
            inset: 0;
            background: #ffffff;
          }

          .order-barcode-print-toolbar {
            display: none !important;
          }

          .order-barcode-print-sheet {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

function OrderBarcodeLabel({ order }) {
  const code = formatInvoiceNumber(order, "N/A");
  const bars = buildBarcodeBars(code);
  const barcodeWidth = bars.reduce((sum, bar) => sum + bar.width, 0);
  const address = getCustomerAddressItems(order)
    .map((item) => item.value)
    .filter(Boolean)
    .join(", ");
  const printedAt = formatBarcodePrintedAt(new Date());

  return (
    <div className="order-barcode-label">
      <p className="order-barcode-label__date">{printedAt}</p>
      <div className="order-barcode-label__content">
        <p className="order-barcode-label__title">Label Print</p>
        <div className="order-barcode-label__barcode">
          <svg
            viewBox={`0 0 ${barcodeWidth} 60`}
            preserveAspectRatio="none"
            aria-label={`Barcode ${code}`}
          >
            <rect width={barcodeWidth} height="60" fill="#ffffff" />
            {
              bars.reduce(
                (items, bar, index) => {
                  const x = items.offset;
                  items.offset += bar.width;
                  if (bar.black) {
                    items.nodes.push(
                      <rect
                        key={`${x}-${index}`}
                        x={x}
                        y="0"
                        width={bar.width}
                        height="60"
                        fill="#000000"
                      />,
                    );
                  }
                  return items;
                },
                { offset: 0, nodes: [] },
              ).nodes
            }
          </svg>
        </div>
        <p className="order-barcode-label__number">
          {code.replace(/\D/g, "") || code}
        </p>
        <p className="order-barcode-label__code">
          {order.customerName || "Customer"}
        </p>
        <p className="order-barcode-label__text">{order.customerPhone || ""}</p>
        <p className="order-barcode-label__text">{address}</p>
      </div>
    </div>
  );
}

function formatBarcodePrintedAt(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hour}:${minute}`;
}

function SearchableSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ||
    options[0];
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) =>
      String(option.label || "")
        .toLowerCase()
        .includes(term),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function selectOption(option) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1 block text-[11px] font-semibold text-gray-500">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-left text-xs text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <span className="min-w-0 truncate">
          {selectedOption?.label || "Select"}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder={`Search ${label.toLowerCase()}...`}
              className="h-8 w-full rounded border border-gray-200 px-2 text-xs text-gray-700 outline-none focus:border-blue-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredOptions.map((option) => {
              const active = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option)}
                  className={`block w-full border-b border-gray-50 px-3 py-2 text-left text-xs last:border-b-0 ${
                    active
                      ? "bg-blue-600 font-semibold text-white"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-3 text-xs text-gray-400">
                No option found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildBarcodeBars(value) {
  const source = String(value || "N/A");
  const bits = source
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
  const framedBits = `1010${bits}0101`;
  const bars = [];
  let black = true;

  for (let i = 0; i < framedBits.length; i += 1) {
    bars.push({
      black,
      width: framedBits[i] === "1" ? 4 : 2,
    });
    black = !black;
  }

  return bars;
}

function OrderInvoicePrintSheet({ orders, siteSettings }) {
  const settings = normalizeSettingData(siteSettings);

  return (
    <div className="order-invoice-print-area">
      <div className="order-invoice-print-toolbar">
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>
      {orders.map((order) => (
        <OrderInvoicePage key={order.Id} order={order} settings={settings} />
      ))}

      <style>{`
        .order-invoice-print-area {
          display: none;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .order-invoice-print-toolbar {
          padding: 12px;
          text-align: center;
        }

        .order-invoice-print-toolbar button {
          border: 1px solid #111827;
          border-radius: 4px;
          background: #ffffff;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
        }

        .bulk-invoice-page {
          width: 760px;
          min-height: 986px;
          margin: 0 auto 24px;
          background: #ffffff;
          padding: 28px 32px;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          break-after: page;
          page-break-after: always;
          overflow: hidden;
        }

        .bulk-invoice-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }

        .bulk-invoice-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }

        .bulk-invoice-logo {
          width: 128px;
          height: 128px;
          border-radius: 999px;
          object-fit: cover;
        }

        .bulk-invoice-top-right {
          text-align: right;
          font-size: 14px;
          line-height: 1.55;
        }

        .bulk-invoice-barcode {
          width: 152px;
          height: 44px;
          margin: 0 0 10px auto;
        }

        .bulk-invoice-barcode svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .bulk-invoice-addresses {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          margin-top: 34px;
          font-size: 14px;
          line-height: 1.55;
        }

        .bulk-invoice-addresses h2 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 700;
        }

        .bulk-invoice-addresses p {
          margin: 0;
        }

        .bulk-invoice-right {
          text-align: right;
        }

        .bulk-invoice-items {
          width: 100%;
          margin-top: 34px;
          border-collapse: collapse;
          font-size: 14px;
        }

        .bulk-invoice-items th {
          border-bottom: 1px solid #d1d5db;
          padding: 9px 0;
          color: #4b5563;
          font-weight: 700;
          text-align: left;
        }

        .bulk-invoice-items td {
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 0;
          color: #374151;
          vertical-align: middle;
        }

        .bulk-invoice-items .center {
          text-align: center;
        }

        .bulk-invoice-items .right {
          text-align: right;
        }

        .bulk-invoice-img {
          display: flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #f3f4f6;
          background: #f9fafb;
          color: #d1d5db;
          font-size: 10px;
        }

        .bulk-invoice-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bulk-invoice-total-wrap {
          display: flex;
          justify-content: flex-end;
        }

        .bulk-invoice-totals {
          width: 350px;
          border-collapse: collapse;
          font-size: 14px;
          color: #374151;
        }

        .bulk-invoice-totals td {
          border: 1px solid #e5e7eb;
          padding: 7px 10px;
          font-weight: 700;
        }

        .bulk-invoice-payment {
          width: 100%;
          margin-top: 24px;
          border-collapse: collapse;
          font-size: 12px;
          color: #374151;
        }

        .bulk-invoice-payment td {
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
          vertical-align: top;
        }

        .bulk-invoice-payment div + div {
          margin-top: 6px;
        }

        .bulk-invoice-footer {
          margin-top: 24px;
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
          text-align: center;
          font-size: 14px;
        }

        .bulk-invoice-footer strong {
          color: #4f46e5;
          font-style: italic;
        }

        .bulk-invoice-footer p {
          margin: 12px 0 0;
          color: #6b7280;
          font-style: italic;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body * {
            visibility: hidden !important;
          }

          .order-invoice-print-area,
          .order-invoice-print-area * {
            visibility: visible !important;
          }

          .order-invoice-print-area {
            display: block !important;
            position: absolute;
            inset: 0;
            background: #ffffff;
          }

          .order-invoice-print-toolbar {
            display: none !important;
          }

          .bulk-invoice-page {
            box-sizing: border-box;
            width: 210mm;
            height: 297mm;
            min-height: 0;
            margin: 0;
            padding: 12mm 14mm;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}

function OrderInvoicePage({ order, settings }) {
  const meta = getOrderNoteMeta(order);
  const items = getInvoiceItems(order, meta);
  const subtotal =
    Number(order.subtotal ?? meta.subtotal) ||
    items.reduce((sum, item) => sum + item.total, 0);
  const shipping = Number(order.deliveryCharge ?? meta.deliveryCharge ?? 0);
  const discount = Number(meta.discount || order.discount || 0);
  const finalTotal =
    Number(order.totalBill || order.total || meta.total) ||
    Math.max(0, subtotal + shipping - discount);
  const paid = Number(
    order.advance || order.paid || meta.advance || meta.paid || 0,
  );
  const due = Math.max(0, finalTotal - paid);
  const invoiceNo = getInvoiceNumber(order);
  const orderDate = order.orderDate || order.createdAt || meta.orderDate;
  const paymentMethod = formatPaymentMethod(
    order.paymentMethod || meta.paymentMethod,
  );
  const sellerName =
    getSiteName(settings) || settings.companyName || "Khilgaon Mart";
  const sellerPhone =
    settings.phone || settings.phoneNumber || "+8809647-222999";
  const sellerEmail = settings.email || "holydeenbd@gmail.com";
  const sellerAddress =
    settings.address || "500/3 Khilgaon Niribili Society, Dhaka Bangladesh";
  const logo = getLogo(settings) || "/homzify-logo.jpeg";
  const customerAddress =
    order.customerAddress ||
    meta.customerAddress ||
    [order.customerArea, order.customerDistrict].filter(Boolean).join(", ");
  const barcodeBars = buildInvoiceBarcodeBars(invoiceNo);
  const barcodeWidth = barcodeBars.reduce((sum, bar) => sum + bar.width, 0);

  return (
    <div className="bulk-invoice-page">
      <header className="bulk-invoice-header">
        <div>
          <img
            src={logo}
            alt={sellerName}
            className="bulk-invoice-logo"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
        <div className="bulk-invoice-top-right">
          <div className="bulk-invoice-barcode">
            <svg viewBox={`0 0 ${barcodeWidth} 60`} preserveAspectRatio="none">
              <rect width={barcodeWidth} height="60" fill="#ffffff" />
              {
                barcodeBars.reduce(
                  (items, bar, index) => {
                    const x = items.offset;
                    items.offset += bar.width;
                    if (bar.black) {
                      items.nodes.push(
                        <rect
                          key={`${x}-${index}`}
                          x={x}
                          y="0"
                          width={bar.width}
                          height="60"
                          fill="#000000"
                        />,
                      );
                    }
                    return items;
                  },
                  { offset: 0, nodes: [] },
                ).nodes
              }
            </svg>
          </div>
          <div>
            ইনভয়েস আইডি : <strong>{invoiceNo}</strong>
          </div>
          <div>
            অর্ডার টাইম : <strong>{formatInvoiceDate(orderDate)}</strong>
          </div>
        </div>
      </header>

      <section className="bulk-invoice-addresses">
        <div>
          <h2>বিক্রেতা</h2>
          <p>{sellerName}</p>
          <p>{sellerEmail}</p>
          <p>{sellerPhone}</p>
          <p>{sellerAddress}</p>
        </div>
        <div className="bulk-invoice-right">
          <h2>পণ্য ডেলিভারির ঠিকানা</h2>
          <p>{order.customerName || "Customer"}</p>
          <p>{order.customerPhone || "N/A"}</p>
          <p>{customerAddress || "N/A"}</p>
        </div>
      </section>

      <table className="bulk-invoice-items">
        <thead>
          <tr>
            <th style={{ width: 96 }}>ছবি</th>
            <th>বিবরণ</th>
            <th className="center" style={{ width: 144 }}>
              পরিমাণ
            </th>
            <th className="right" style={{ width: 144 }}>
              মোট মূল্য
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="bulk-invoice-img">
                  {item.image ? (
                    <img
                      src={imageUrl(item.image)}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.parentElement.textContent = "IMG";
                      }}
                    />
                  ) : (
                    "IMG"
                  )}
                </div>
              </td>
              <td>{item.name}</td>
              <td className="center">
                {item.qty} x {invoiceMoney(item.unitPrice)}
              </td>
              <td className="right">{invoiceMoney(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="bulk-invoice-total-wrap">
        <table className="bulk-invoice-totals">
          <tbody>
            <InvoiceTotalRow
              label="পণ্যের মোট মূল্য"
              value={invoiceMoney(subtotal)}
            />
            <InvoiceTotalRow
              label="ডেলিভারি চার্জ (+)"
              value={invoiceMoney(shipping)}
            />
            <InvoiceTotalRow label="ছাড় (-)" value={invoiceMoney(discount)} />
            <InvoiceTotalRow
              label="পরিশোধ যোগ্য"
              value={invoiceMoney(finalTotal)}
            />
            <InvoiceTotalRow label="পরিশোধ" value={invoiceMoney(paid)} />
            <InvoiceTotalRow label="বাকি" value={invoiceMoney(due)} />
          </tbody>
        </table>
      </section>

      <table className="bulk-invoice-payment">
        <tbody>
          <tr>
            <InvoiceInfoCell
              label="Transaction Date"
              value={formatInvoiceDate(orderDate)}
            />
            <InvoiceInfoCell label="Payment Gateway" value={paymentMethod} />
            <InvoiceInfoCell
              label="Transaction ID"
              value={order.transactionId || meta.transactionId || ""}
            />
            <InvoiceInfoCell
              label="Account Number"
              value={order.accountNumber || meta.accountNumber || ""}
            />
            <InvoiceInfoCell label="Amount" value={paid || 0} />
          </tr>
        </tbody>
      </table>

      <footer className="bulk-invoice-footer">
        <strong>Terms & Conditions</strong>
        <p>
          * This is a computer generated invoice, does not require any
          signature.
        </p>
      </footer>
    </div>
  );
}

function InvoiceTotalRow({ label, value }) {
  return (
    <tr>
      <td>{label}</td>
      <td style={{ width: 128 }}>{value}</td>
    </tr>
  );
}

function InvoiceInfoCell({ label, value }) {
  return (
    <td>
      <div>{label}</div>
      <div>{value || ""}</div>
    </td>
  );
}

function getInvoiceNumber(order) {
  return formatInvoiceNumber(order);
}

function invoiceMoney(value) {
  return `${Number(value || 0).toLocaleString()}৳`;
}

function formatInvoiceDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function getInvoiceItems(order, meta) {
  const source = Array.isArray(order.items)
    ? order.items
    : Array.isArray(meta.items)
      ? meta.items
      : [];

  if (source.length) {
    return source.map((item, index) => {
      const qty = Number(item.qty || item.quantity || 1) || 1;
      const unitPrice = Number(item.price || item.salePrice || 0);
      const total = Number(item.total || item.lineTotal || unitPrice * qty);
      return {
        id: item.id || item.productId || index,
        productId: item.productId || item.id || null,
        name: `${item.name || item.productName || "Product"}${item.variant ? ` (${item.variant})` : ""}${weightAdjustText(item)}`,
        qty,
        unitPrice: unitPrice || Math.round(total / qty),
        total,
        image: getInvoiceItemImage(item),
      };
    });
  }

  const qty = Number(order.quantity || 1) || 1;
  const total = Number(order.totalBill || order.total || 0);
  return [
    {
      id: order.Id || "single",
      productId: order.productId || meta.productId || null,
      name: order.productName || "Product",
      qty,
      unitPrice: Math.round(total / qty),
      total,
      image: order.productImage || "",
    },
  ];
}

function getInvoiceItemImage(item) {
  if (item.image || item.productImage) return item.image || item.productImage;
  if (Array.isArray(item.images) && item.images[0]) return item.images[0];
  if (typeof item.images === "string") {
    try {
      const parsed = JSON.parse(item.images);
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    } catch {
      return item.images;
    }
  }
  return "";
}

function buildInvoiceBarcodeBars(value) {
  const text = String(value || "000000");
  const bits = text
    .split("")
    .map((char, index) => {
      const code = char.charCodeAt(0) + index * 13;
      return code.toString(2).padStart(8, "0");
    })
    .join("");
  const framedBits = `101${bits}101`;
  const bars = [];
  let black = true;

  for (let i = 0; i < framedBits.length; i += 1) {
    bars.push({
      black,
      width: framedBits[i] === "1" ? 3 : 1,
    });
    black = !black;
  }

  return bars;
}

function getOrderNoteMeta(order) {
  const parsed = parseOrderNote(order.note);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
    return parsed;
  return {};
}

function getSteadfastInfo(order) {
  const meta = getOrderNoteMeta(order);
  return meta.courierIntegration?.steadfast || {};
}

function getPathaoInfo(order) {
  const meta = getOrderNoteMeta(order);
  return meta.courierIntegration?.pathao || {};
}

function canSendOrderToCourier(order) {
  const steadfastInfo = getSteadfastInfo(order);
  const pathaoInfo = getPathaoInfo(order);
  return (
    toOrderStatusKey(order?.status) === "confirmed" &&
    !steadfastInfo.trackingCode &&
    !steadfastInfo.consignmentId &&
    !pathaoInfo.trackingCode &&
    !pathaoInfo.consignmentId
  );
}

function getOrderAdminNotes(order) {
  const meta = getOrderNoteMeta(order);
  const notes = Array.isArray(meta.adminNotes) ? meta.adminNotes : [];
  return notes
    .map((item) => {
      if (typeof item === "string") return { text: item, createdAt: null };
      return {
        text: String(item?.text || "").trim(),
        createdAt: item?.createdAt || null,
      };
    })
    .filter((item) => item.text);
}

function buildOrderNoteWithAdminNote(order, noteText) {
  const text = String(noteText || "").trim();
  return buildOrderNoteWithAdminNotes(order, [
    ...getOrderAdminNotes(order),
    {
      text,
      createdAt: new Date().toISOString(),
    },
  ]);
}

function buildOrderNoteWithAdminNotes(order, adminNotes) {
  const existingMeta = getOrderNoteMeta(order);
  const meta = {
    ...existingMeta,
    __frontendOrder: existingMeta.__frontendOrder ?? true,
    adminNotes: adminNotes
      .map((item) => ({
        text: String(item?.text || "").trim(),
        createdAt: item?.createdAt || new Date().toISOString(),
      }))
      .filter((item) => item.text),
  };

  if (!existingMeta.adminNotes && order.note && !parseOrderNote(order.note)) {
    meta.legacyNote = order.note;
  }

  return JSON.stringify(meta);
}

function buildOrderNoteWithSource(order, source) {
  const existingMeta = getOrderNoteMeta(order);
  const meta = {
    ...existingMeta,
    __frontendOrder: existingMeta.__frontendOrder ?? true,
    source: source || "Website",
  };

  if (!existingMeta.adminNotes && order.note && !parseOrderNote(order.note)) {
    meta.legacyNote = order.note;
  }

  return JSON.stringify(meta);
}

function getOrderSource(order) {
  const meta = getOrderNoteMeta(order);
  const source = String(
    order.source ||
      order.orderSource ||
      order.platform ||
      meta.source ||
      meta.orderSource ||
      meta.platform ||
      "",
  ).trim();
  if (source) return source;
  if (meta.landingPageId || meta.landingPage || meta.campaignId)
    return "Landing Page";
  return "Website";
}

function formatNoteTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getItemImage(item) {
  if (item.image) return item.image;
  if (Array.isArray(item.images) && item.images[0]) return item.images[0];
  if (typeof item.images === "string") {
    try {
      const parsed = JSON.parse(item.images);
      if (Array.isArray(parsed) && parsed[0]) return parsed[0];
    } catch {
      return item.images;
    }
  }
  return "";
}

async function copyToClipboard(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Fallback below */
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function getWhatsappUrl(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits || digits.length < 8) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `880${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("1"))
    digits = `880${digits}`;
  return `https://wa.me/${digits}`;
}

function getPhoneCallUrl(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits || digits.length < 8) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `880${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("1"))
    digits = `880${digits}`;
  return `tel:+${digits}`;
}

function getCustomerAddressItems(order) {
  const values = [
    { value: order.customerAddress, className: "bg-slate-100 text-slate-600" },
    { value: order.customerArea, className: "bg-blue-100 text-blue-600" },
    {
      value: order.customerDistrict,
      className: "bg-purple-100 text-purple-600",
    },
  ];
  const seen = new Set();
  return values
    .map((item) => ({ ...item, value: String(item.value || "").trim() }))
    .filter((item) => {
      if (!item.value || seen.has(item.value.toLowerCase())) return false;
      seen.add(item.value.toLowerCase());
      return true;
    });
}

function CopyButton({ value, title = "Copy", size = 11, className = "" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(event) {
    event.preventDefault();
    event.stopPropagation();
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`relative inline-flex items-center justify-center rounded transition ${className}`}
      title={copied ? "Copied" : title}
    >
      {copied ? <CheckCircle2 size={size} /> : <Copy size={size} />}
      {copied && (
        <span className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
          Copied
        </span>
      )}
    </button>
  );
}

function getLocalDateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOrderCustomerKey(order) {
  const phone = String(order.customerPhone || "").replace(/\D/g, "");
  if (phone) return `phone:${phone}`;
  const name = String(order.customerName || "")
    .trim()
    .toLowerCase();
  return name ? `name:${name}` : "";
}

function getSameDayDuplicateOrderIds(orders = []) {
  const groups = new Map();
  orders.forEach((order) => {
    const customerKey = getOrderCustomerKey(order);
    const dateKey = getLocalDateKey(order.orderDate || order.createdAt);
    if (!customerKey || !dateKey) return;
    const key = `${customerKey}:${dateKey}`;
    const ids = groups.get(key) || [];
    ids.push(order.Id);
    groups.set(key, ids);
  });

  const duplicateIds = new Set();
  groups.forEach((ids) => {
    if (ids.length <= 1) return;
    ids.forEach((id) => duplicateIds.add(id));
  });
  return duplicateIds;
}

function getOrderProductItems(order) {
  const note = parseOrderNote(order.note);
  const noteItems = Array.isArray(note?.items) ? note.items : [];
  if (noteItems.length) {
    return noteItems.map((item, index) => {
      const qty = Number(item.qty || item.quantity || 1) || 1;
      return {
        id: item.id || item.productId || `${order.Id}-${index}`,
        name: item.name || item.productName || "Product",
        variant: item.variant || "",
        qty,
        price: Number(item.price || item.salePrice || item.total || 0),
        image: getItemImage(item),
      };
    });
  }

  const qty = Number(order.quantity || 1) || 1;
  return [
    {
      id: order.Id,
      name: order.productName || "Product",
      qty,
      price: Number(order.totalBill || 0),
      image: order.productImage || "",
    },
  ];
}

function formatPaymentMethod(value) {
  const normalized = String(value || "cod").trim();
  if (!normalized) return "Cash On Delivery";
  const key = normalized.toLowerCase().replace(/[\s_-]+/g, "_");
  const labels = {
    cod: "Cash On Delivery",
    cash_on_delivery: "Cash On Delivery",
    bkash: "Bkash",
    nagad: "Nagad",
    rocket: "Rocket",
    sslcommerz: "SSLCommerz",
    card: "Card",
    bank_transfer: "Bank Transfer",
  };
  return (
    labels[key] ||
    normalized
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getOrderAmountSummary(order) {
  const meta = getOrderNoteMeta(order);
  const total = Number(order.totalBill || order.total || meta.total || 0);
  const less = Number(
    order.discount || order.less || meta.discount || meta.less || 0,
  );
  const paid = Number(
    order.advance || order.paid || meta.advance || meta.paid || 0,
  );
  const due = Math.max(0, total - less - paid);
  return { total, less, paid, due };
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function OrderNoteModal({ order, mode, onSave, onReplaceNotes, onClose }) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState(() => getOrderAdminNotes(order));
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isAddMode = mode === "add";

  async function handleSubmit(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value) {
      setError("Note লিখুন");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(order, value);
      onClose();
    } catch (err) {
      setError(err.message || "Note save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(note, index) {
    setEditIndex(index);
    setEditText(note.text);
    setError("");
  }

  function cancelEdit() {
    setEditIndex(null);
    setEditText("");
    setError("");
  }

  async function saveEdit(index) {
    const value = editText.trim();
    if (!value) {
      setError("Note খালি রাখা যাবে না");
      return;
    }
    const nextNotes = notes.map((note, noteIndex) =>
      noteIndex === index ? { ...note, text: value } : note,
    );
    setSaving(true);
    setError("");
    try {
      await onReplaceNotes(order, nextNotes);
      setNotes(nextNotes);
      cancelEdit();
    } catch (err) {
      setError(err.message || "Note update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(index) {
    if (!window.confirm("এই note delete করবেন?")) return;
    const nextNotes = notes.filter((_, noteIndex) => noteIndex !== index);
    setSaving(true);
    setError("");
    try {
      await onReplaceNotes(order, nextNotes);
      setNotes(nextNotes);
      if (editIndex === index) cancelEdit();
      else if (editIndex > index) setEditIndex(editIndex - 1);
    } catch (err) {
      setError(err.message || "Note delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {isAddMode ? "Add Note" : "Order Notes"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatInvoiceNumber(order)} · {order.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-gray-500 transition hover:bg-gray-200"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4">
          {isAddMode && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Order note লিখুন..."
                autoFocus
              />
              {error && (
                <div className="text-xs font-medium text-red-500">{error}</div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Save Note
                </button>
              </div>
            </form>
          )}

          {!isAddMode && (
            <div className="space-y-2">
              {error && (
                <div className="text-xs font-medium text-red-500">{error}</div>
              )}
              {notes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400">
                  No notes added yet.
                </div>
              ) : (
                notes.map((note, index) => (
                  <div
                    key={`${note.createdAt || "note"}-${index}`}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {editIndex === index ? (
                        <div className="flex-1 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(event) =>
                              setEditText(event.target.value)
                            }
                            rows={3}
                            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit(index)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                            >
                              {saving && (
                                <Loader2 size={12} className="animate-spin" />
                              )}
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="flex-1 whitespace-pre-wrap text-sm leading-5 text-gray-700">
                          {note.text}
                        </p>
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        {editIndex !== index && (
                          <>
                            <CopyButton
                              value={note.text}
                              title="Copy note"
                              className="h-6 w-6 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            />
                            <button
                              type="button"
                              onClick={() => startEdit(note, index)}
                              disabled={saving}
                              className="flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-60"
                              title="Edit note"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteNote(index)}
                              disabled={saving}
                              className="flex h-6 w-6 items-center justify-center rounded bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                              title="Delete note"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {note.createdAt && (
                      <div className="mt-1 text-[10px] font-medium text-gray-400">
                        {formatNoteTime(note.createdAt)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductInfoModal({ order, onClose }) {
  const items = getOrderProductItems(order);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/45 px-4 pt-7"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] overflow-hidden rounded bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">
            Product Information
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-x-auto px-4 py-3">
          <table className="w-full min-w-[460px] text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500">
                  Image
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500">
                  Name
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-500">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-500">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-3 py-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded border border-gray-100 bg-gray-50 text-[9px] text-gray-300">
                      {item.image ? (
                        <img
                          src={imageUrl(item.image)}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.parentElement.textContent =
                              "IMG";
                          }}
                        />
                      ) : (
                        "IMG"
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="max-w-[210px] leading-5">{item.name}</div>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600">
                    {item.qty}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    ৳ {Number(item.price || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function riskBadgeClass(riskLevel) {
  if (riskLevel === "low") return "bg-emerald-100 text-emerald-700";
  if (riskLevel === "medium") return "bg-amber-100 text-amber-700";
  if (riskLevel === "high") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

function successBarClass(successRate) {
  if (successRate >= 80) return "bg-emerald-500";
  if (successRate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function FraudCheckModal({ order, data, loading, error, onRefresh, onClose }) {
  const stats = data?.courierStats || [];
  const totals = data?.totals || {};
  const ipInfo = data?.ipInfo || {};
  const hasMap = ipInfo.latitude != null && ipInfo.longitude != null;
  const mapUrl = hasMap
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${ipInfo.latitude},${ipInfo.longitude}`)}&z=13&output=embed`
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/45 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[780px] overflow-hidden rounded bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Parcel Result For {order.customerPhone || "Unknown"}
            </h2>
            {data?.checkedAt && (
              <div className="mt-0.5 text-[10px] text-gray-400">
                Checked: {new Date(data.checkedAt).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex h-7 items-center gap-1 rounded bg-indigo-50 px-2 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-60"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {loading && !data ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Checking fraud data...
            </div>
          ) : error ? (
            <div className="rounded border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
              {error}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskBadgeClass(data?.riskLevel)}`}
                >
                  Risk: {data?.riskLevel || "unknown"}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Success: {data?.successRate ?? 0}%
                </span>
              </div>

              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="bg-indigo-600 text-white">
                      <th className="px-3 py-3 text-left font-semibold">
                        Courier
                      </th>
                      <th className="px-3 py-3 text-left font-semibold">
                        Total Parcel
                      </th>
                      <th className="px-3 py-3 text-left font-semibold">
                        Delivered
                      </th>
                      <th className="px-3 py-3 text-left font-semibold">
                        Return
                      </th>
                      <th className="px-3 py-3 text-left font-semibold">
                        Success
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((row) => (
                      <tr
                        key={row.courier}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <td className="px-3 py-3 text-gray-600">
                          {row.courier}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {row.totalParcel}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {row.delivered}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {row.return}
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {row.success}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold text-gray-700">
                      <td className="px-3 py-3">Total</td>
                      <td className="px-3 py-3">{totals.totalParcel || 0}</td>
                      <td className="px-3 py-3">{totals.delivered || 0}</td>
                      <td className="px-3 py-3">{totals.return || 0}</td>
                      <td className="px-3 py-3">{totals.successRate || 0}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <section className="overflow-hidden rounded border border-gray-200">
                <div className="flex items-center justify-between bg-gray-100 px-4 py-3">
                  <h3 className="text-sm font-bold text-gray-700">
                    IP Based Location
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    {ipInfo.note || "Approximate ISP/Tower location"}
                  </span>
                </div>
                <div className="grid gap-4 p-4 md:grid-cols-[1fr_1.1fr]">
                  <table className="w-full text-xs">
                    <tbody>
                      {[
                        ["Customer IP", ipInfo.ip || order.ipAddress || "—"],
                        ["Country", ipInfo.country || "—"],
                        ["Division / Region", ipInfo.region || "—"],
                        ["City", ipInfo.city || "—"],
                        ["Latitude", ipInfo.latitude ?? "—"],
                        ["Longitude", ipInfo.longitude ?? "—"],
                      ].map(([label, value]) => (
                        <tr key={label} className="border border-gray-200">
                          <td className="w-36 px-3 py-2 font-semibold text-gray-600">
                            {label}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="min-h-[230px] overflow-hidden rounded border border-gray-200 bg-gray-50">
                    {hasMap ? (
                      <iframe
                        title="Approximate IP location"
                        src={mapUrl}
                        className="h-[260px] w-full border-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full min-h-[230px] items-center justify-center px-4 text-center text-xs text-gray-400">
                        Map unavailable for this IP address.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  index,
  onView,
  onEdit,
  onPrintOrder,
  onDelete,
  onBlockIp,
  onToggleFraudStatus,
  onProductInfo,
  onFraudCheck,
  onCustomerProfile,
  onAddNote,
  onShowNotes,
  onSourceChange,
  onStatusChange,
  statusOptions,
  onSendToSteadfast,
  onSendToPathao,
  onSyncSteadfastStatus,
  onSyncPathaoStatus,
  courierBusy,
  selected,
  onSelect,
  isSameDayDuplicate,
  statusLabels,
  statusColors,
}) {
  const statusKey = toOrderStatusKey(order.status);
  const statusColor = statusColors[statusKey] || "#0d9488";
  const statusLabel = statusLabels[statusKey] || order.status;
  const canUseTableStatusSelect = Boolean(statusOptions?.includes(statusKey));
  const customerBadge = isSameDayDuplicate
    ? { label: "Duplicate", className: "bg-amber-500" }
    : order.isRepeat
      ? { label: "Regular", className: "bg-green-600" }
      : { label: "New", className: "bg-gray-400" };
  const whatsappUrl = getWhatsappUrl(order.customerPhone);
  const phoneCallUrl = getPhoneCallUrl(order.customerPhone);
  const address = getCustomerAddressItems(order)
    .map((item) => item.value)
    .join(", ");
  const adminNotes = getOrderAdminNotes(order);
  const lastNote = adminNotes[adminNotes.length - 1];
  const amountSummary = getOrderAmountSummary(order);
  const orderSource = getOrderSource(order);
  const items = getOrderProductItems(order);
  const assignedEmployeeName = getAssignedEmployeeName(order);
  const assignedByName = getAssignedByName(order);
  const steadfastInfo = getSteadfastInfo(order);
  const pathaoInfo = getPathaoInfo(order);
  const steadfastBooked = Boolean(steadfastInfo.trackingCode || steadfastInfo.consignmentId);
  const courierStatus = steadfastInfo.status
    ? { courier: "Steadfast", label: formatCourierStatus(steadfastInfo.status) }
    : pathaoInfo.status
      ? { courier: "Pathao", label: formatCourierStatus(pathaoInfo.status) }
      : null;
  const pathaoBooked = Boolean(pathaoInfo.trackingCode || pathaoInfo.consignmentId);
  const canSendCourier = canSendOrderToCourier(order);
  const summary = order.courierSummary || {};
  const successRate = summary.successRate;
  const guard = order.fraudGuard || {};
  const created = order.createdAt ? new Date(order.createdAt) : null;
  const dateStr = created
    ? created.toLocaleDateString("en-GB")
    : order.orderDate
      ? new Date(order.orderDate).toLocaleDateString("en-GB")
      : "—";
  const timeStr = created
    ? created
        .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        .replace(" ", "")
        .toLowerCase()
    : "";
  const invoice = formatInvoiceNumber(order);

  return (
    <tr className={`border-b border-gray-200 align-middle transition hover:bg-teal-50/30 ${selected ? "bg-teal-50/40" : ""}`}>
      <td className="border-r border-gray-200 px-2 py-2">
        {canUseTableStatusSelect ? (
          <select
            value={statusKey}
            onChange={(event) => onStatusChange(event.target.value)}
            className="max-w-[96px] cursor-pointer appearance-none border-0 bg-transparent bg-none p-0 text-sm font-medium outline-none focus:ring-0"
            style={{ color: statusColor }}
            title="Update order status"
          >
            {statusOptions?.map((status) => (
              <option key={status} value={status} className="text-gray-700">
                {statusLabels[status] || status}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm font-medium" style={{ color: statusColor }}>
            {statusLabel}
          </div>
        )}
        <div className="text-[13px] text-gray-500">sl: {index}</div>
        {courierStatus && (
          <div
            className="mt-0.5 max-w-[110px] text-[11px] leading-tight text-indigo-600"
            title={`${courierStatus.courier} courier status`}
          >
            <span className="text-gray-400">Courier:</span> {courierStatus.label}
          </div>
        )}
        <div className="mt-1.5 flex gap-1">
          <RowIconButton title="View" onClick={onView} className="text-cyan-600 hover:bg-cyan-50">
            <Eye size={12} />
          </RowIconButton>
          <RowIconButton title="Print Order" onClick={onPrintOrder} className="text-emerald-600 hover:bg-emerald-50">
            <Printer size={12} />
          </RowIconButton>
          <RowIconButton title="Delete" onClick={onDelete} className="text-red-500 hover:bg-red-50">
            <Trash2 size={12} />
          </RowIconButton>
        </div>
      </td>

      <td className="border-r border-gray-200 px-2 py-2 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          title={`Select ${invoice}`}
        />
        <button
          type="button"
          onClick={onCustomerProfile}
          className={`mt-1 block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${customerBadge.className}`}
          title="View customer profile"
        >
          {customerBadge.label}
        </button>
        <CopyButton
          value={invoice}
          title={`Copy ${invoice}`}
          size={11}
          className="mx-auto mt-1 h-6 w-6 border border-gray-200 text-gray-600 hover:bg-gray-100"
        />
      </td>

      <td className="border-r border-gray-200 px-2 py-2">
        <select
          value={ORDER_SOURCE_OPTIONS.includes(orderSource) ? orderSource : "Other"}
          onChange={(event) => onSourceChange(event.target.value)}
          className="max-w-[130px] cursor-pointer appearance-none border-0 bg-transparent bg-none p-0 text-sm text-gray-700 outline-none focus:ring-0"
          title={`Source: ${orderSource} (click to change)`}
        >
          {ORDER_SOURCE_OPTIONS.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
        {!ORDER_SOURCE_OPTIONS.includes(orderSource) && (
          <div className="max-w-[120px] truncate text-xs text-gray-400">{orderSource}</div>
        )}
      </td>

      <td className="border-r border-gray-200 px-2 py-2 text-center">
        <button
          type="button"
          onClick={onAddNote}
          className="text-lg leading-none text-teal-600 transition hover:text-teal-800"
          title="Add note"
        >
          +
        </button>
        {lastNote && (
          <button
            type="button"
            onClick={onShowNotes}
            className="mt-1 block max-w-[90px] text-left text-xs leading-tight text-gray-500 hover:text-teal-700"
            title="Show all notes"
          >
            <span className="line-clamp-2">{lastNote.text}</span>
            {adminNotes.length > 1 && (
              <span className="font-semibold text-teal-600">+{adminNotes.length - 1} more</span>
            )}
          </button>
        )}
      </td>

      <td className="border-r border-gray-200 px-2 py-2">
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-teal-600 hover:underline"
          title="Open order details"
        >
          {invoice}
        </button>
        <div className="mt-1 space-y-1">
          {items.slice(0, 3).map((item, itemIndex) => (
            <div key={`${item.id}-${itemIndex}`} className="flex items-start gap-1.5">
              <ItemThumb src={item.image} />
              <div className="min-w-[200px] max-w-[240px] text-sm leading-snug text-gray-800">
                {item.qty} × {item.name}
                {item.variant && <span className="text-gray-500"> ({item.variant})</span>}
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-xs text-gray-500">+{items.length - 3} more item</div>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 pl-8 text-[13px] text-gray-700">
          {Number(amountSummary.total).toLocaleString()}Tk
          <button
            type="button"
            onClick={onProductInfo}
            className="text-teal-600 hover:text-teal-800"
            title="Product information"
          >
            <List size={13} />
          </button>
          <ItemStockButton order={order} />
        </div>
      </td>

      <td className="border-r border-gray-200 px-2 py-2">
        <div className="flex items-center gap-1 text-sm text-teal-600">
          <button
            type="button"
            onClick={onEdit}
            className="max-w-[170px] truncate text-left hover:text-teal-800 hover:underline"
            title="Open & edit order details"
          >
            {order.customerName}
          </button>
          {order.customerName && (
            <CopyButton value={order.customerName} title="Copy customer name" size={10} className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          )}
          <button
            type="button"
            onClick={onCustomerProfile}
            className="text-gray-500 hover:text-teal-700"
            title="Customer profile & order history"
          >
            <CalendarDays size={11} />
          </button>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 p-1">
          <span className="px-1 text-sm font-semibold tracking-wide text-gray-700">
            {order.customerPhone}
          </span>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-6 w-6 items-center justify-center rounded bg-teal-600 text-white transition hover:bg-teal-700"
              title="Open WhatsApp"
            >
              <MessageCircle size={12} />
            </a>
          )}
          {phoneCallUrl && (
            <a
              href={phoneCallUrl}
              className="inline-flex h-6 w-6 items-center justify-center rounded bg-teal-600 text-white transition hover:bg-teal-700"
              title="Call"
            >
              <Phone size={12} />
            </a>
          )}
          {order.customerPhone && (
            <CopyButton
              value={order.customerPhone}
              title="Copy phone number"
              size={11}
              className="h-6 w-6 bg-gray-500 text-white hover:bg-gray-600"
            />
          )}
        </div>
      </td>

      <td className="border-r border-gray-200 px-2 py-2 text-gray-600">
        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm">
          <CalendarDays size={11} className="text-gray-400" />
          {dateStr}
          <span className="text-xs text-gray-400">{timeStr}</span>
        </div>
        {order.ipAddress && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400" title={order.ipAddress}>
            <span className="max-w-[110px] truncate font-mono">IP: {order.ipAddress}</span>
            <CopyButton value={order.ipAddress} title="Copy IP" size={9} className="h-4 w-4 hover:text-gray-600" />
            <button
              type="button"
              onClick={onBlockIp}
              className="text-red-400 hover:text-red-600"
              title={`Block IP: ${order.ipAddress}`}
            >
              <Ban size={10} />
            </button>
          </div>
        )}
      </td>

      <td className="border-r border-gray-200 px-2 py-2">
        {address ? (
          <div className="flex min-w-[170px] max-w-[230px] items-start gap-1 text-sm leading-snug text-teal-600">
            <span>{address}</span>
            <CopyButton value={address} title="Copy address" size={10} className="h-4 w-4 flex-shrink-0 text-gray-500 hover:text-gray-700" />
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      <td className="border-r border-gray-200 px-2 py-2">
        <button
          type="button"
          onClick={onFraudCheck}
          className="block w-[250px] text-left"
          title="View fraud check"
        >
          <div className="flex items-center gap-1.5">
            <div className="relative h-1 flex-1 overflow-hidden rounded bg-red-500">
              <div
                className={`absolute inset-y-0 left-0 ${successRate == null ? "bg-gray-300" : "bg-green-600"}`}
                style={{ width: `${successRate == null ? 100 : successRate}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {successRate == null ? "—" : `${successRate}%`}
            </span>
          </div>
          <div className="mt-1 flex justify-between gap-2 whitespace-nowrap text-xs text-gray-500">
            <span>
              {summary.parcels || 0} parcels ·{" "}
              <span className="text-green-600">{summary.delivered || 0} ok</span> ·{" "}
              <span className="text-red-500">{summary.failed || 0} fail</span>
            </span>
            <span>
              {summary.orders || 0} order{summary.orders === 1 ? "" : "s"} · {summary.completed || 0} completed
            </span>
          </div>
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {order.courier && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-700">
              {order.courier}
              {steadfastInfo.trackingCode ? ` · ${steadfastInfo.trackingCode}` : ""}
            </span>
          )}
          {guard.status && guard.status !== "safe" && (
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${guard.status === "fake" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
              title={guard.reason}
            >
              {guard.label}
            </span>
          )}
          <RowIconButton
            title={guard.status === "fake" ? "Mark as Safe" : "Mark as Fake"}
            onClick={onToggleFraudStatus}
            className={guard.status === "fake" ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"}
          >
            <ShieldAlert size={12} />
          </RowIconButton>
          {(steadfastBooked || canSendCourier) && (
            <RowIconButton
              title={steadfastBooked ? "Sync Steadfast status" : "Send to Steadfast"}
              onClick={steadfastBooked ? onSyncSteadfastStatus : onSendToSteadfast}
              disabled={courierBusy}
              className="text-blue-600 hover:bg-blue-50"
            >
              {courierBusy ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
              <span className="text-[11px] font-semibold">SF</span>
            </RowIconButton>
          )}
          {(pathaoBooked || canSendCourier) && (
            <RowIconButton
              title={pathaoBooked ? "Sync Pathao status" : "Send to Pathao"}
              onClick={pathaoBooked ? onSyncPathaoStatus : onSendToPathao}
              disabled={courierBusy}
              className="text-rose-600 hover:bg-rose-50"
            >
              {courierBusy ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
              <span className="text-[11px] font-semibold">PT</span>
            </RowIconButton>
          )}
        </div>
      </td>

      <td className="border-r border-gray-200 px-2 py-2 whitespace-nowrap text-[13px] leading-5">
        <div className="text-teal-600">Total: {formatAmount(amountSummary.total)}</div>
        <div className="font-semibold text-red-500">Less: {formatAmount(amountSummary.less)}</div>
        <div className="text-green-600">Paid: {formatAmount(amountSummary.paid)}</div>
        <div className="text-orange-500">Due: {formatAmount(amountSummary.due)}</div>
      </td>

      <td className="px-2 py-2 text-sm text-gray-700">
        {assignedEmployeeName || <span className="text-gray-400">All</span>}
        {assignedByName && (
          <div className="mt-0.5 text-xs text-gray-400">
            by {assignedByName}
            {order.assignedAt && ` · ${new Date(order.assignedAt).toLocaleDateString("en-GB")}`}
          </div>
        )}
      </td>
    </tr>
  );
}

// Current stock of the order's items, fetched when the icon is clicked.
function ItemStockButton({ order }) {
  const [state, setState] = useState({ loading: false, lines: null, error: "" });

  async function loadStock() {
    setState({ loading: true, lines: null, error: "" });
    try {
      const items = getItemListLines(order);
      const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
      const products = new Map(
        await Promise.all(
          productIds.map((id) =>
            productService
              .getById(id)
              .then((res) => [id, res?.data || null])
              .catch(() => [id, null]),
          ),
        ),
      );
      const lines = items.map((item) => {
        const variations = products.get(item.productId)?.variations || [];
        const variation = variations.find((row) => Number(row.Id) === item.variantId);
        // Without a variant on the order, show the product's total stock.
        const stock = variation
          ? Number(variation.stock || 0)
          : variations.length
            ? variations.reduce((sum, row) => sum + Number(row.stock || 0), 0)
            : null;
        return { name: item.name, stock };
      });
      setState({ loading: false, lines, error: "" });
    } catch (err) {
      setState({ loading: false, lines: null, error: err.message || "Stock load failed" });
    }
  }

  const single = state.lines?.length === 1;
  return (
    <>
      <button
        type="button"
        onClick={loadStock}
        disabled={state.loading}
        className="text-teal-600 hover:text-teal-800 disabled:opacity-60"
        title="Check stock"
      >
        {state.loading ? <Loader2 size={13} className="animate-spin" /> : <Boxes size={13} />}
      </button>
      {state.error && <span className="text-xs text-red-500">{state.error}</span>}
      {state.lines && (
        <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700">
          {state.lines.map((line, index) => (
            <span
              key={index}
              className={`flex gap-1 whitespace-nowrap ${line.stock !== null && line.stock <= 0 ? "text-red-600" : ""}`}
            >
              <span className={single ? "" : "max-w-[110px] truncate"} title={line.name}>
                {single ? "Stock" : line.name}:
              </span>
              <span>{line.stock === null ? "N/A" : `${line.stock} Unit`}</span>
            </span>
          ))}
        </span>
      )}
    </>
  );
}

function formatCourierStatus(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function RowIconButton({ title, onClick, disabled = false, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-6 min-w-[24px] items-center justify-center gap-0.5 rounded border border-gray-200 px-1 transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function ItemThumb({ src }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 text-[9px] text-gray-300">
      {src && !failed ? (
        <img src={imageUrl(src)} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        "IMG"
      )}
    </div>
  );
}

function PageSizeSelect({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      Show
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-8 rounded border border-gray-200 bg-white px-2 text-sm outline-none focus:border-teal-500"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      entries
    </label>
  );
}

// 1 2 3 4 5 … 37 style page list around the current page.
function getPageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
  if (page >= totalPages - 3) {
    return [1, "…", ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
  }
  return [1, "…", page - 1, page, page + 1, "…", totalPages];
}

function Pagination({ page, totalPages, onChange }) {
  const buttonClass =
    "h-8 min-w-[32px] rounded border border-gray-200 px-2.5 text-xs transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`${buttonClass} bg-white text-gray-600 hover:bg-gray-50`}
      >
        Previous
      </button>
      {getPageList(page, totalPages).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className={`${buttonClass} inline-flex items-center bg-gray-100 text-gray-400`}>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`${buttonClass} ${item === page ? "border-teal-600 bg-teal-600 font-semibold text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={`${buttonClass} bg-white text-gray-600 hover:bg-gray-50`}
      >
        Next
      </button>
    </div>
  );
}

const ACTION_SELECT_CLASS =
  "h-9 w-full rounded border border-gray-300 bg-white px-3 text-xs text-gray-700 outline-none focus:border-teal-500";

function ActionButton({ color, icon, onClick, busy = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex h-8 items-center gap-1 rounded px-3 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60 ${color}`}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

function ActionField({ label, buttonLabel, onSubmit, busy, error, children }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-gray-700">{label}</span>
      {children}
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="mt-2 inline-flex h-8 items-center gap-1 rounded bg-teal-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
      >
        {busy && <Loader2 size={13} className="animate-spin" />}
        {buttonLabel}
      </button>
      {error && <div className="mt-1 text-xs font-semibold text-red-500">{error}</div>}
    </div>
  );
}

