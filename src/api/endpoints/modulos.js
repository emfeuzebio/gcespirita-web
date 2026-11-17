import { http } from '@/api/http';

export const modulosApi = {
  list() {
    return http.get('/acl/modulos');
  },
  get(id) {
    return http.get(`/acl/modulos/${id}`);
  },
  update(id, payload) {
    return http.put(`/acl/modulos/${id}`, payload);
  },
};