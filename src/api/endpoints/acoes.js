import { http } from '@/api/http';

export const acoesApi = {
  list(params = {}) {
    return http.get('/acl/acoes', { params });
  },
  get(id) {
    return http.get(`/acl/acoes/${id}`);
  },
  create(payload) {
    return http.post('/acl/acoes', payload);
  },
  update(id, payload) {
    return http.put(`/acl/acoes/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/acl/acoes/${id}`);
  },
};