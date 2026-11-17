/**
 * Contexto do tenant ativo, desacoplado do Pinia.
 *
 * Motivo de existir: o http.js precisa do tenant ativo para injetar o
 * header X-Tenant, mas importar o store diretamente criaria acoplamento
 * com Pinia e risco de "no active Pinia" se o interceptor rodar antes de
 * app.use(pinia). O store tenant.js mantém este objeto em sincronia.
 */

/** @type {{ tenantId: number|null }} */
const context = { tenantId: null };

/**
 * Define o tenant ativo.
 * @param {number|null|undefined} id
 */
export function setTenantId(id) {
  context.tenantId = Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Retorna o id do tenant ativo (ou null).
 * @returns {number|null}
 */
export function getTenantId() {
  return context.tenantId;
}

/**
 * Retorna o header X-Tenant pronto para uso (ou null se não houver tenant).
 * @returns {string|null}
 */
export function getTenantHeader() {
  return context.tenantId !== null ? String(context.tenantId) : null;
}

/** Limpa o tenant ativo. */
export function resetTenant() {
  context.tenantId = null;
}