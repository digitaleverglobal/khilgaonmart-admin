import { apiRequest, buildQuery } from '../utils/apiClient';

export const landingPageService = {
  getAll: (params = {}) => apiRequest(`/landing-pages${buildQuery(params)}`),
  getOne: (id) => apiRequest(`/landing-pages/${id}`),
  getPublicOne: (id) => apiRequest(`/landing-pages/public/${id}`),
  create: (data) => apiRequest('/landing-pages/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/landing-pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  duplicate: (id) => apiRequest(`/landing-pages/${id}/duplicate`, { method: 'POST' }),
  delete: (id) => apiRequest(`/landing-pages/${id}`, { method: 'DELETE' }),
  getPublicHeader: () => apiRequest('/landing-pages/header/public'),
  getPublicFooter: () => apiRequest('/landing-pages/footer/public'),
};
