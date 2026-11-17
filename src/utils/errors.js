import { resetCsrf } from '@/api/csrf';
import { normalizeEnvelope } from './envelope';

/**
 * Converte erro axios em objeto padronizado e rejeita a promise.
 * Status conforme seção 14 do Doc 1 (+419 para CSRF expirado).
 */
export function handleHttpError(error) {
  const status = error.response?.status ?? 0;
  const body = error.response?.data;
  const envelope = body
    ? normalizeEnvelope(body)
    : { success: false, message: '', errors: null };

  // Sessão expirada ou CSRF inválido: força rebuscar o cookie na próxima req.
  if (status === 401 || status === 419) {
    resetCsrf();
  }

  const messageByStatus = {
    401: 'Sessão expirada. Faça login novamente.',
    403: 'Você não tem permissão para esta ação.',
    404: 'Recurso não encontrado.',
    409: 'Conflito: o recurso está em uso.',
    419: 'Sessão expirada. Recarregue a página.',
    422: 'Verifique os campos destacados.',
    500: 'Erro interno. Tente novamente mais tarde.',
  };

  return Promise.reject({
    status,
    message:
      envelope.message ||
      messageByStatus[status] ||
      `Erro inesperado (HTTP ${status}).`,
    errors: envelope.errors,
    raw: body,
  });
}