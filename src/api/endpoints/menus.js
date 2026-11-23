import { http } from '@/api/http';

export const menusApi = {
  /** GET /api/v1/acl/menus — retorna árvore (nós com children) */
  list() {
    return http.get('/acl/menus');
  },

  /** GET /api/v1/acl/menus/{id} */
  get(id) {
    return http.get(`/acl/menus/${id}`);
  },

  /** POST /api/v1/acl/menus  { modulo_id, parent_id, ordem, titulo, icone, rota, tipo, ativo } */
  create(payload) {
    return http.post('/acl/menus', payload);
  },

  /** PUT /api/v1/acl/menus/{id}  { modulo_id, parent_id, ordem, titulo, icone, rota, tipo, ativo } */
  update(id, payload) {
    return http.put(`/acl/menus/${id}`, payload);
  },

  /** DELETE /api/v1/acl/menus/{id} */
  remove(id) {
    return http.delete(`/acl/menus/${id}`);
  },

  // ─────────────────────────────────────────────────────────────
  // Vínculo Menu × Perfil (aba "Permissões por Perfil")
  // ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/acl/menus/{menuId}/perfis
   * Retorna **só os perfis vinculados** (com `ativo` do pivô).
   * O front filtra `ativo === 'SIM'` para o Set de permissões.
   *
   * @param {number} menuId
   * @returns {Promise<{data: Array<{id:number, sigla:string, descricao:string, ativo:'SIM'|'NAO'}>}>}
   */
  getPerfis(menuId) {
    return http.get(`/acl/menus/${menuId}/perfis`);
  },

  /**
   * POST /api/v1/acl/menus/{menuId}/perfis — ativar (soft, `ativo='SIM'`).
   * Upsert: se já existe linha para (menu, perfil), atualiza `ativo`.
   *
   * @param {number} menuId
   * @param {number} perfilId
   * @returns {Promise<{data: null, message: string}>}
   */
  vincularPerfil(menuId, perfilId) {
    return http.post(`/acl/menus/${menuId}/perfis`, {
      perfil_id: perfilId,
      ativo: 'SIM',
    });
  },

  /**
   * POST /api/v1/acl/menus/{menuId}/perfis — desativar (soft-revoke, `ativo='NAO'`).
   * NÃO usa DELETE (preserva a linha para audit).
   *
   * @param {number} menuId
   * @param {number} perfilId
   * @returns {Promise<{data: null, message: string}>}
   */
  desvincularPerfil(menuId, perfilId) {
    return http.post(`/acl/menus/${menuId}/perfis`, {
      perfil_id: perfilId,
      ativo: 'NAO',
    });
  },
};