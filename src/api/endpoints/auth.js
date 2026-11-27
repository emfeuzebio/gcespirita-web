import { http } from '@/api/http';

export const authApi = {
  login({ email, senha }) {
    return http.post('/auth/login', { email, senha });
  },
  logout() {
    return http.post('/auth/logout');
  },
  me() {
    return http.get('/auth/me');
  },
  definirSenha(email, token, novaSenha) {
    return http.post('/auth/definir-senha', {
      email,
      token,
      nova_senha: novaSenha,
    });
  },
};