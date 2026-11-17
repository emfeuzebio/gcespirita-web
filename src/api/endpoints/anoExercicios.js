import { http } from '@/api/http';

export const anoExerciciosApi = {
  list() {
    return http.get('/ano-exercicios');
  },
  get(id) {
    return http.get(`/ano-exercicios/${id}`);
  },
  create(payload) {
    return http.post('/ano-exercicios', payload);
  },
  update(id, payload) {
    return http.put(`/ano-exercicios/${id}`, payload);
  },
  remove(id) {
    return http.delete(`/ano-exercicios/${id}`);
  },
};