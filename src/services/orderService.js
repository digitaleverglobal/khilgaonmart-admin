import { apiRequest, buildQuery } from "../utils/apiClient";

export const orderService = {
  getOrders: (params = {}) => apiRequest(`/orders${buildQuery(params)}`),
  getStatusCounts: () => apiRequest("/orders/status-counts"),
  getFilterOptions: () => apiRequest("/orders/filter-options"),
  getReport: (type, params = {}) => apiRequest(`/orders/report/${type}${buildQuery(params)}`),
  getSalesSummary: (params = {}) => apiRequest(`/orders/sales-summary${buildQuery(params)}`),
  getPackingList: (params = {}) => apiRequest(`/orders/packing-list${buildQuery(params)}`),
  bulkAction: (orderIds = [], action, value) =>
    apiRequest("/orders/bulk-action", {
      method: "POST",
      body: JSON.stringify({ orderIds, action, value }),
    }),
  sendSms: (orderIds = [], smsText) =>
    apiRequest("/orders/send-sms", { method: "POST", body: JSON.stringify({ orderIds, smsText }) }),
  markPrinted: (orderIds = []) =>
    apiRequest("/orders/mark-printed", { method: "POST", body: JSON.stringify({ orderIds }) }),
  getPathaoCities: () => apiRequest("/orders/courier/pathao/cities"),
  getPathaoZones: (cityId) => apiRequest(`/orders/courier/pathao/cities/${cityId}/zones`),
  getAssignees: () => apiRequest("/orders/assignees"),
  getOrderById: (id) => apiRequest(`/orders/${id}`),
  addAttachment: (id, file) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest(`/orders/${id}/attachments`, { method: "POST", body });
  },
  getFraudCheck: (id, params = {}) =>
    apiRequest(`/orders/${id}/fraud-check${buildQuery(params)}`),
  // Courier stats + order totals for a phone before its order exists.
  getPhoneFraudCheck: (phone) =>
    apiRequest(`/orders/fraud-check${buildQuery({ phone })}`),
  trackOrders: (phone) => apiRequest(`/orders/track${buildQuery({ phone })}`),
  createOrder: (data) =>
    apiRequest("/orders", { method: "POST", body: JSON.stringify(data) }),
  // Staff-created orders (POS) — authenticated, staff prices, variant stock tracked.
  createStaffOrder: (data) =>
    apiRequest("/orders/admin", { method: "POST", body: JSON.stringify(data) }),
  saveIncompleteOrder: (data) =>
    apiRequest("/orders/incomplete", { method: "POST", body: JSON.stringify(data) }),
  updateOrder: (id, data) =>
    apiRequest(`/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) =>
    apiRequest(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  sendToSteadfast: (id, data = {}) =>
    apiRequest(`/orders/${id}/courier/steadfast`, { method: "POST", body: JSON.stringify(data) }),
  sendToPathao: (id, data = {}) =>
    apiRequest(`/orders/${id}/courier/pathao`, { method: "POST", body: JSON.stringify(data) }),
  bulkSendToSteadfast: (orderIds = [], data = {}) =>
    apiRequest("/orders/courier/steadfast/bulk", {
      method: "POST",
      body: JSON.stringify({ ...data, orderIds }),
    }),
  bulkSendToPathao: (orderIds = [], data = {}) =>
    apiRequest("/orders/courier/pathao/bulk", {
      method: "POST",
      body: JSON.stringify({ ...data, orderIds }),
    }),
  bulkAssign: (orderIds = [], employeeId) =>
    apiRequest("/orders/assign", {
      method: "POST",
      body: JSON.stringify({ orderIds, employeeId }),
    }),
  syncSteadfastStatus: (id) =>
    apiRequest(`/orders/${id}/courier/steadfast/status`),
  syncPathaoStatus: (id) =>
    apiRequest(`/orders/${id}/courier/pathao/status`),
  getSteadfastBalance: () => apiRequest("/orders/courier/steadfast/balance"),
  createSteadfastReturn: (id, reason = "") =>
    apiRequest(`/orders/${id}/courier/steadfast/return`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  deleteOrder: (id) =>
    apiRequest(`/orders/${id}`, { method: "DELETE" }),
};
