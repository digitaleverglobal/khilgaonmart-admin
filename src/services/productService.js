import { apiRequest, buildQuery } from "../utils/apiClient";

export const productService = {
  getAll: (params) => apiRequest(`/product${buildQuery(params)}`),
  getById: (id) => apiRequest(`/product/${id}`),
  create: (data) => apiRequest("/product/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/product/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/product/${id}`, { method: "DELETE" }),
  // Copies the product and its variations; the copy starts Inactive with no stock.
  duplicate: (id) => apiRequest(`/product/${id}/duplicate`, { method: "POST" }),
};

export const categoryService = {
  getAll: (params) => apiRequest(`/category${buildQuery(params)}`),
  getAllList: () => apiRequest("/category/all"),
  getById: (id) => apiRequest(`/category/${id}`),
  create: (data) => apiRequest("/category/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/category/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/category/${id}`, { method: "DELETE" }),
};

export const subcategoryService = {
  getAll: (params) => apiRequest(`/subcategory${buildQuery(params)}`),
  getAllList: () => apiRequest("/subcategory/all"),
  getById: (id) => apiRequest(`/subcategory/${id}`),
  create: (data) => apiRequest("/subcategory/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/subcategory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/subcategory/${id}`, { method: "DELETE" }),
};

export const childcategoryService = {
  getAll: (params) => apiRequest(`/childcategory${buildQuery(params)}`),
  getAllList: () => apiRequest("/childcategory/all"),
  getById: (id) => apiRequest(`/childcategory/${id}`),
  create: (data) => apiRequest("/childcategory/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/childcategory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/childcategory/${id}`, { method: "DELETE" }),
};

export const brandService = {
  getAll: (params) => apiRequest(`/brand${buildQuery(params)}`),
  getAllList: () => apiRequest("/brand/all"),
  getById: (id) => apiRequest(`/brand/${id}`),
  create: (data) => apiRequest("/brand/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/brand/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/brand/${id}`, { method: "DELETE" }),
};

export const colorService = {
  getAll: (params) => apiRequest(`/color${buildQuery(params)}`),
  getAllList: () => apiRequest("/color/all"),
  getById: (id) => apiRequest(`/color/${id}`),
  create: (data) => apiRequest("/color/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/color/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/color/${id}`, { method: "DELETE" }),
};

export const attributeService = {
  getAll: (params) => apiRequest(`/attribute${buildQuery(params)}`),
  getAllList: () => apiRequest("/attribute/all"),
  getById: (id) => apiRequest(`/attribute/${id}`),
  create: (data) => apiRequest("/attribute/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/attribute/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/attribute/${id}`, { method: "DELETE" }),
};

export const reviewService = {
  getAll: (params) => apiRequest(`/review${buildQuery(params)}`),
  getById: (id) => apiRequest(`/review/${id}`),
  create: (data) => apiRequest("/review/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/review/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/review/${id}`, { method: "DELETE" }),
};

export const comboOfferService = {
  getAll: (params) => apiRequest(`/combo-offers${buildQuery(params)}`),
  getById: (id) => apiRequest(`/combo-offers/${id}`),
  create: (data) => apiRequest("/combo-offers/create", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/combo-offers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/combo-offers/${id}`, { method: "DELETE" }),
};
