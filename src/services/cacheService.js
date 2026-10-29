import { apiRequest } from '../utils/apiClient';

export const cacheService = {
  clear: () => apiRequest('/cache/clear', { method: 'POST' }),
};
