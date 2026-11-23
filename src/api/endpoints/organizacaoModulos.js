import { http } from '@/api/http';

/**
 * Módulos por tenant (sub-recurso de organizações).
 *
 * Endpoints (Doc 1, seção 10):
 *   GET  /api/v1/acl/organizacoes/{orgId}/modulos  → catálogo completo + estado no tenant
 *   PUT  /api/v1/acl/organizacoes/{orgId}/modulos  → concede/revoga em lote
 */
export const organizacaoModulosApi = {
  /**
   * Lista todos os módulos do catálogo com o estado de cada um no tenant.
   *
   * @param {number} orgId
   * @returns {Promise<{data: Array<{modulo_id:number, codigo:string, nome:string, ativo_global:'SIM'|'NAO', ativo_no_tenant:'SIM'|'NAO', pode_desativar:boolean}>}>}
   */
  list(orgId) {
    return http.get(`/acl/organizacoes/${orgId}/modulos`);
  },

  /**
   * Aplica concessões/revogações em lote. O backend faz upsert por (org, modulo)
   * e retorna o catálogo completo já atualizado.
   *
   * @param {number} orgId
   * @param {Array<{modulo_id:number, ativo:'SIM'|'NAO'}>} modulos
   * @returns {Promise<{data: Array}>}
   */
  update(orgId, modulos) {
    return http.put(`/acl/organizacoes/${orgId}/modulos`, { modulos });
  },
};