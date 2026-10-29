import { apiRequest, buildQuery } from "../utils/apiClient";

export const dashboardService = {
  getStats: (params = {}) => apiRequest(`/dashboard/stats${buildQuery(params)}`),
};
