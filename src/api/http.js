import { normalizeEnvelope } from '@/utils/envelope';
import { handleHttpError } from '@/utils/errors';
import axios from 'axios';
import { ensureCsrf, getXsrfToken } from './csrf';
import { getTenantHeader } from './tenant-context';

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX;

// Rotas tenant-scoped (Doc 1, seção 5). Só essas levam X-Tenant.
// Padrão: prefixo fixo OU regex que extrai orgId da URL.
const TENANT_SCOPED_PREFIXES = ['/equipes', '/servicos', '/voluntarios'];

// Regex para rotas que embutem o orgId no path (ex.: /acl/organizacoes/7/modulos).
// Essas rotas usam o orgId da URL como X-Tenant — não o tenant ativo do store.
const TENANT_FROM_PATH_REGEX = /^\/acl\/organizacoes\/(\d+)\//;

function resolveTenantHeader(url = '') {
  // 1) Se a URL embute orgId, ele manda (fonte da verdade é o path).
  const match = url.match(TENANT_FROM_PATH_REGEX);
  if (match) {
    return String(match[1]);
  }

  // 2) Rotas tenant-scoped "clássicas" usam o tenant do store.
  if (TENANT_SCOPED_PREFIXES.some((p) => url.startsWith(p))) {
    return getTenantHeader();
  }

  // 3) Demais rotas são globais — sem X-Tenant.
  return null;
}

export const http = axios.create({
  baseURL: `${API_ORIGIN}${API_PREFIX}`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

http.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase();

  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    await ensureCsrf();
    config.headers['X-XSRF-TOKEN'] = getXsrfToken();
  }

  const tenantHeader = resolveTenantHeader(config.url);
  if (tenantHeader) {
    config.headers['X-Tenant'] = tenantHeader;
  }

  return config;
});

http.interceptors.response.use(
  (response) => normalizeEnvelope(response.data),
  (error) => handleHttpError(error),
);