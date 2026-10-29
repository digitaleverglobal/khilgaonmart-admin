import { apiRequest, buildQuery } from "../utils/apiClient";

export const supplierService = {
  getAll: (params) => apiRequest(`/supplier${buildQuery(params)}`),
  getAllList: () => apiRequest("/supplier/all"),
  getById: (id) => apiRequest(`/supplier/${id}`),
  create: (data) => apiRequest("/supplier/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/supplier/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/supplier/${id}`, { method: "DELETE" }),
};

export const supplierHistoryService = {
  getAll: (params) => apiRequest(`/supplier-history${buildQuery(params)}`),
  getAllList: () => apiRequest("/supplier-history/all"),
  getBySupplierId: (id) => apiRequest(`/supplier-history/${id}`),
  create: (data) => apiRequest("/supplier-history/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/supplier-history/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/supplier-history/${id}`, { method: "DELETE" }),
};
