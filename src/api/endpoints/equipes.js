import { http } from '@/api/http';

export const equipesApi = {
  /** GET /api/v1/equipes */
  list() {
    return http.get('/equipes');
  },

  /** GET /api/v1/equipes/{id} */
  get(id) {
    return http.get(`/equipes/${id}`);
  },

  /** POST /api/v1/equipes */
  create(payload) {
    return http.post('/equipes', payload);
  },

  /** PUT /api/v1/equipes/{id} */
  update(id, payload) {
    return http.put(`/equipes/${id}`, payload);
  },

  /** DELETE /api/v1/equipes/{id} */
  remove(id) {
    return http.delete(`/equipes/${id}`);
  },
};