import { apiRequest, buildQuery } from "../utils/apiClient";

export const purchaseService = {
  getAll: (params) => apiRequest(`/purchase-requisition${buildQuery(params)}`),
  getAllList: () => apiRequest("/purchase-requisition/all"),
  getById: (id) => apiRequest(`/purchase-requisition/${id}`),
  create: (data) => apiRequest("/purchase-requisition/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/purchase-requisition/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/purchase-requisition/${id}`, { method: "DELETE" }),
};
