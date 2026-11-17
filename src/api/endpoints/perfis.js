import { http } from '@/api/http';

export const perfisApi = {
  list() {
    return http.get('/acl/perfis');
  },
  get(id) {
    return http.get(`/acl/perfis/${id}`);
  },
  create(payload) {
    return http.post('/acl/perfis', payload);
  },
  update(id, payload) {
    return http.put(`/acl/perfis/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/acl/perfis/${id}`);
  },
};