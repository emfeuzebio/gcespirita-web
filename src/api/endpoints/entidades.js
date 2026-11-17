import { http } from '@/api/http';

export const entidadesApi = {
  list() {
    return http.get('/acl/entidades');
  },
  get(id) {
    return http.get(`/acl/entidades/${id}`);
  },
  create(payload) {
    return http.post('/acl/entidades', payload);
  },
  update(id, payload) {
    return http.put(`/acl/entidades/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/acl/entidades/${id}`);
  },
};