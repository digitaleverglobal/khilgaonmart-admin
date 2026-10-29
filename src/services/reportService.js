import { apiRequest, buildQuery } from '../utils/apiClient';

export const reportService = {
  get: (type, params = {}) => apiRequest(`/reports/${type}${buildQuery(params)}`),
  getOptions: () => apiRequest('/reports/options'),
};

export const expenseService = {
  getAll: () => apiRequest('/expenses'),
  create: (data) => apiRequest('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/expenses/${id}`, { method: 'DELETE' }),
  getCategories: () => apiRequest('/expenses/categories'),
  createCategory: (data) => apiRequest('/expenses/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiRequest(`/expenses/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiRequest(`/expenses/categories/${id}`, { method: 'DELETE' }),
};
