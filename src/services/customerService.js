import { apiRequest, buildQuery } from "../utils/apiClient";

// Customers: one per phone number, built from orders on the backend.
export const customerService = {
  list: (params) => apiRequest(`/customer/admin/list${buildQuery(params)}`),
  getById: (id) => apiRequest(`/customer/admin/${id}`),
  update: (id, data) => apiRequest(`/customer/admin/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/customer/admin/${id}`, { method: "DELETE" }),
  getRewards: (id) => apiRequest(`/customer/admin/${id}/rewards`),
  adjustRewards: (id, data) =>
    apiRequest(`/customer/admin/${id}/rewards/adjust`, { method: "POST", body: JSON.stringify(data) }),
};
