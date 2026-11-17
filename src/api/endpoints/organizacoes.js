import { http } from '@/api/http';

export const organizacoesApi = {
  /** GET /api/v1/organizacoes */
  list() {
    return http.get('/organizacoes');
  },

  /** GET /api/v1/organizacoes/{id} */
  get(id) {
    return http.get(`/organizacoes/${id}`);
  },

  /** POST /api/v1/organizacoes */
  create(payload) {
    return http.post('/organizacoes', payload);
  },

  /** PUT /api/v1/organizacoes/{id} */
  update(id, payload) {
    return http.put(`/organizacoes/${id}`, payload);
  },

  /** DELETE /api/v1/organizacoes/{id} */
  remove(id) {
    return http.delete(`/organizacoes/${id}`);
  },
};