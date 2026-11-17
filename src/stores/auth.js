import { authApi } from '@/api/endpoints/auth';
import { defineStore } from 'pinia';
import { useTenantStore } from './tenant';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: null,
    organizacao: null,
    organizacoesAcessiveis: [],
    loaded: false,
  }),

  getters: {
    isAuthenticated: (s) => !!s.usuario,
    isSuperAdmin: (s) => s.usuario?.id === 1,
    precisaTrocarSenha: (s) => s.usuario?.precisa_trocar_senha === 'SIM',
  },

  actions: {
    _applySession(data) {
      this.usuario = data?.usuario ?? null;
      this.organizacao = data?.organizacao ?? null;
      this.organizacoesAcessiveis = data?.organizacoes_acessiveis ?? [];

      // Delega para o tenantStore gerenciar a lista e respeitar o sessionStorage no reload
      const tenant = useTenantStore();
      tenant.initFromAuth(data);

      this.loaded = true;
    },

    async login({ email, senha }) {
      const res = await authApi.login({ email, senha });
      const data = res.data ?? {};
      const usuario = data.usuario ?? null;
      if (!usuario) {
        throw { status: 500, message: 'Resposta de login sem usuário.', errors: null };
      }
      if (usuario.ativo === 'NAO') {
        throw { status: 403, message: 'Usuário inativo. Procure o administrador.', errors: null };
      }
      this._applySession(data);
      return usuario;
    },

    async fetchMe() {
      const res = await authApi.me();
      this._applySession(res.data ?? {});
      return this.usuario;
    },

    async logout() {
      try {
        await authApi.logout();
      } finally {
        this.usuario = null;
        this.organizacao = null;
        this.organizacoesAcessiveis = [];
        this.loaded = true;
        const tenant = useTenantStore();
        tenant.reset();
      }
    },
  },
});