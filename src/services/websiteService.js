import { apiRequest, buildQuery } from "../utils/apiClient";

export const ipBlockService = {
  getAll: (params = {}) => apiRequest(`/ip-blocks${buildQuery(params)}`),
  create: (data) => apiRequest("/ip-blocks/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/ip-blocks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/ip-blocks/${id}`, { method: "DELETE" }),
};

export const siteSettingService = {
  get: (settingType) => apiRequest(`/site-settings/${settingType}`),
  upsert: (settingType, data) =>
    apiRequest(`/site-settings/${settingType}`, {
      method: "PUT",
      body: JSON.stringify({ data }),
    }),
};

export const deliveryAreaService = {
  getAll: (params = {}) => apiRequest(`/delivery-areas${buildQuery(params)}`),
  create: (data) => apiRequest("/delivery-areas/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/delivery-areas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/delivery-areas/${id}`, { method: "DELETE" }),
};

export const orderStatusService = {
  getAll: (params = {}) => apiRequest(`/order-status${buildQuery(params)}`),
  create: (data) => apiRequest("/order-status/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/order-status/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/order-status/${id}`, { method: "DELETE" }),
};

export const websitePageService = {
  getAll: (params = {}) => apiRequest(`/website-pages${buildQuery(params)}`),
  create: (data) => apiRequest("/website-pages/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/website-pages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/website-pages/${id}`, { method: "DELETE" }),
};

export const chargeSettingService = {
  getAll: (chargeType, params = {}) =>
    apiRequest(`/charge-settings${buildQuery({ chargeType, ...params })}`),
  create: (chargeType, data) =>
    apiRequest("/charge-settings/create", {
      method: "POST",
      body: JSON.stringify({ chargeType, ...data }),
    }),
  update: (id, chargeType, data) =>
    apiRequest(`/charge-settings/${id}`, {
      method: "PUT",
      body: JSON.stringify({ chargeType, ...data }),
    }),
  delete: (id, chargeType) =>
    apiRequest(`/charge-settings/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ chargeType }),
    }),
};
