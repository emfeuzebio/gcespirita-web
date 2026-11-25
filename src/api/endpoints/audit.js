import { http } from '@/api/http';

export const auditApi = {
  list(params = {}) {
    return http.get('/acl/audit', { params });
  },
};