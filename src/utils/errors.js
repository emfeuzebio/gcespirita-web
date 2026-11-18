import { resetCsrf } from '@/api/csrf';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
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

  // Tratamento específico para 401 (Sessão Expirada)
  if (status === 401) {
    // Limpa estado do auth e tenant
    const authStore = useAuthStore();
    const tenantStore = useTenantStore();

    authStore.usuario = null;
    authStore.organizacao = null;
    authStore.organizacoesAcessiveis = [];
    authStore.loaded = true;
    tenantStore.reset();

    // Redireciona para o login salvando a rota atual de origem e avisando que expirou
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name !== 'login') {
      router.push({
        path: '/auth/login',
        query: { 
          expired: '1', 
          redirect: currentRoute.fullPath !== '/' ? currentRoute.fullPath : undefined 
        }
      });
    }
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