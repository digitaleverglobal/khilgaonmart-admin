import { apiRequest } from '../utils/apiClient';
export const integrationService = {
  test: (type, provider, config) =>
    apiRequest(`/integrations/${type}/test`, {
      method: 'POST',
      body: JSON.stringify(config ? { provider, config } : { provider }),
    }),
};
