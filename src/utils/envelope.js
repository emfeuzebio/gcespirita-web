/**
 * Normaliza o envelope do backend:
 *   sucesso: { success: true, data: {...}, message: "OK", meta?: {...} }
 *   erro:    { success: false, message: "...", errors: { campo: [...] } }
 * Retorna sempre { success, data, message, meta, errors }.
 */
export function normalizeEnvelope(body) {
  if (body && typeof body === 'object' && 'success' in body) {
    return {
      success: body.success === true,
      data: body.data ?? null,
      message: body.message ?? '',
      meta: body.meta ?? null,
      errors: body.errors ?? null,
    };
  }
  return { success: true, data: body ?? null, message: '', meta: null, errors: null };
}