const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;

let csrfReady = false;

function readXsrfCookie() {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

/**
 * Garante o cookie XSRF-TOKEN. O endpoint Sanctum fica na RAIZ do backend,
 * fora do prefixo /api/v1. Chamar antes de qualquer POST/PUT/PATCH/DELETE.
 */
export async function ensureCsrf() {
  if (csrfReady) return;
  const res = await fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw { status: res.status, message: 'Falha ao obter CSRF cookie.', errors: null };
  }
  csrfReady = true;
}

export function getXsrfToken() {
  return readXsrfCookie();
}

export function resetCsrf() {
  csrfReady = false;
}
