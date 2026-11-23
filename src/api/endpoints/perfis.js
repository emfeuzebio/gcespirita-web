import { http } from '@/api/http';

export const perfisApi = {
  list(params = {}) {
    return http.get('/acl/perfis', { params }); // <- Repassando os parâmetros de query string aqui
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

  carregarAutorizacoes(perfilId) {
    return http.get(`/acl/perfis/${perfilId}/autorizacoes`);
  },

  atualizarAutorizacao(perfilId, acaoId, ativo) {
    return http.put(`/acl/perfis/${perfilId}/autorizacoes/${acaoId}`, { ativo });
  },
};