import { http } from '@/api/http';

export const usuariosApi = {
  list(params) {
    return http.get('/acl/usuarios', { params });
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

  // Endpoints Master-Detail de Perfis do Usuário
  getPerfis(id) {
    return http.get(`/acl/usuarios/${id}/perfis`);
  },
  vincularPerfis(id, payload) {
    return http.post(`/acl/usuarios/${id}/perfis`, payload);
  },
  desvincularPerfil(usuarioId, perfilId) {
    return http.delete(`/acl/usuarios/${usuarioId}/perfis/${perfilId}`);
  },  
  
  // Lista global de perfis disponíveis no sistema
  listarTodosPerfis() {
    return http.get('/acl/perfis');
  },
};