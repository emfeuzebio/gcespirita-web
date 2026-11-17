import { http } from '@/api/http';

export const escolaridadesApi = {
  /** GET /api/v1/escolaridades — retorna { success, data: [...], message } */
  list() {
    return http.get('/escolaridades');
  },

  /** GET /api/v1/escolaridades/{id} */
  get(id) {
    return http.get(`/escolaridades/${id}`);
  },

  /** POST /api/v1/escolaridades  { descricao, sigla } */
  create(payload) {
    return http.post('/escolaridades', payload);
  },

  /** PUT /api/v1/escolaridades/{id}  { descricao, sigla } */
  update(id, payload) {
    return http.put(`/escolaridades/${id}`, payload);
  },

  /** DELETE /api/v1/escolaridades/{id} */
  remove(id) {
    return http.delete(`/escolaridades/${id}`);
  },
};