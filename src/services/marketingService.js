import { apiRequest, buildQuery } from "../utils/apiClient";

export const tagManagerService = {
  getAll: (params = {}) => apiRequest(`/tag-managers${buildQuery(params)}`),
  create: (data) => apiRequest("/tag-managers/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/tag-managers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/tag-managers/${id}`, { method: "DELETE" }),
};

export const facebookPixelService = {
  getAll: (params = {}) => apiRequest(`/facebook-pixels${buildQuery(params)}`),
  create: (data) => apiRequest("/facebook-pixels/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/facebook-pixels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/facebook-pixels/${id}`, { method: "DELETE" }),
};

export const tiktokPixelService = {
  getAll: (params = {}) => apiRequest(`/tiktok-pixels${buildQuery(params)}`),
  create: (data) => apiRequest("/tiktok-pixels/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/tiktok-pixels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/tiktok-pixels/${id}`, { method: "DELETE" }),
};

export const googleAdsService = {
  getAll: (params = {}) => apiRequest(`/google-ads${buildQuery(params)}`),
  create: (data) => apiRequest("/google-ads/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/google-ads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/google-ads/${id}`, { method: "DELETE" }),
};

export const couponCodeService = {
  getAll: (params = {}) => apiRequest(`/coupon-codes${buildQuery(params)}`),
  create: (data) => apiRequest("/coupon-codes/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/coupon-codes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/coupon-codes/${id}`, { method: "DELETE" }),
};

export const visitorStatService = {
  track: () => apiRequest("/visitor-stats/track", { method: "POST" }),
  getStats: () => apiRequest("/visitor-stats/stats"),
};

export const smsMarketingService = {
  send: (data) => apiRequest("/sms-marketing/send", { method: "POST", body: JSON.stringify(data) }),
};

export const facebookCatalogueService = {
  refresh: () => apiRequest("/facebook-catalogue/refresh", { method: "POST" }),
};
