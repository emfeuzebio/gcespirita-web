import { normalizeEnvelope } from '@/utils/envelope';
import { handleHttpError } from '@/utils/errors';
import axios from 'axios';
import { ensureCsrf, getXsrfToken } from './csrf';
import { getTenantHeader } from './tenant-context';

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX;

// Rotas tenant-scoped (Doc 1, seção 5). Só essas levam X-Tenant.
const TENANT_SCOPED_PREFIXES = [
  '/equipes',
  '/servicos',
  '/voluntarios',
  '/acl/organizacoes/',
];

function isTenantScoped(url = '') {
  return TENANT_SCOPED_PREFIXES.some((p) => url.startsWith(p));
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

  if (isTenantScoped(config.url)) {
    const tenantHeader = getTenantHeader();
    if (tenantHeader) {
      config.headers['X-Tenant'] = tenantHeader;
    }
  }

  return config;
});

http.interceptors.response.use(
  (response) => normalizeEnvelope(response.data),
  (error) => handleHttpError(error),
);