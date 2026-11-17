import { resetTenant, setTenantId } from '@/api/tenant-context';
import { defineStore } from 'pinia';

/**
 * @typedef {Object} Organizacao
 * @property {number} id
 * @property {number} organizacao_id
 * @property {string} nome
 * @property {string} sigla
 * @property {string} subdominio
 */

export const useTenantStore = defineStore('tenant', {
  state: () => ({
    /** @type {Organizacao|null} Tenant atualmente selecionado */
    ativo: null,
    /** @type {Organizacao[]} Organizações acessíveis ao usuário logado */
    lista: [],
  }),

  getters: {
    temAtivo: (s) => !!s.ativo?.id,
    ativoId: (s) => s.ativo?.id ?? null,
    opcoes: (s) =>
      s.lista.map((o) => ({
        label: `${o.nome} (${o.sigla})`,
        value: o.id,
      })),
  },

  actions: {
    /** @param {Organizacao[]} lista */
    setLista(lista) {
      this.lista = Array.isArray(lista) ? lista : [];
    },

    /** @param {Organizacao|null} organizacao */
    setAtivo(organizacao) {
      this.ativo = organizacao ?? null;
      const id = this.ativo?.id ?? null;
      
      setTenantId(id);
      
      // Persiste no sessionStorage para o reload não sobrescrever com o default
      if (id) {
        sessionStorage.setItem('@gcespirita:tenant_ativo', String(id));
      } else {
        sessionStorage.removeItem('@gcespirita:tenant_ativo');
      }
    },

    /**
     * @param {number} id
     * @returns {boolean}
     */
    trocarPorId(id) {
      const encontrada = this.lista.find((o) => o.id === id);
      if (!encontrada) return false;
      this.setAtivo(encontrada);
      return true;
    },

    reset() {
      this.ativo = null;
      this.lista = [];
      sessionStorage.removeItem('@gcespirita:tenant_ativo');
      resetTenant();
    },

    /**
     * Inicializa o tenant a partir do payload de login ou /auth/me,
     * respeitando o que estiver salvo no sessionStorage se ainda for acessível.
     * @param {Object} data - Objeto data retornado pela API
     */
    initFromAuth(data) {
      const listaOrg = data?.organizacoes_acessiveis ?? [];
      this.setLista(listaOrg);

      // Verifica se há um tenant salvo anteriormente no sessionStorage
      const savedTenantId = sessionStorage.getItem('@gcespirita:tenant_ativo');
      let orgSelecionada = null;

      if (savedTenantId) {
        orgSelecionada = listaOrg.find((o) => o.id === Number(savedTenantId));
      }

      // Se não houver salvo ou não for mais válido, cai no default do backend ou na primeira da lista
      if (!orgSelecionada) {
        orgSelecionada = data?.organizacao ?? listaOrg[0] ?? null;
      }

      this.setAtivo(orgSelecionada);
    },
  },
});