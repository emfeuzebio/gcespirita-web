import { http } from '@/api/http';

export const usuariosApi = {
  list() {
    return http.get('/acl/usuarios');
  },
  get(id) {
    return http.get(`/acl/usuarios/${id}`);
  },
  create(payload) {
    return http.post('/acl/usuarios', payload);
  },
  update(id, payload) {
    return http.put(`/acl/usuarios/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/acl/usuarios/${id}`);
  },
};