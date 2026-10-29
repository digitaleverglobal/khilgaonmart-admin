import { apiRequest, buildQuery } from "../utils/apiClient";

export const bannerCategoryService = {
  getAll: (params = {}) => apiRequest(`/banner-categories${buildQuery(params)}`),
  getAllList: () => apiRequest("/banner-categories/all"),
  create: (data) => apiRequest("/banner-categories/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/banner-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/banner-categories/${id}`, { method: "DELETE" }),
};

export const bannerAdsService = {
  getAll: (params = {}) => apiRequest(`/banners${buildQuery(params)}`),
  create: (data) => apiRequest("/banners/create", { method: "POST", body: data }),
  update: (id, data) => apiRequest(`/banners/${id}`, { method: "PUT", body: data }),
  delete: (id) => apiRequest(`/banners/${id}`, { method: "DELETE" }),
};
