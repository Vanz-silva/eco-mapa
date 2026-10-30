const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { params, method = 'GET', body, signal } = {}) {
  const url = new URL(BASE + path);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }
  let json = null;
  try { json = await res.json(); } catch { /* corpo vazio */ }
  if (!res.ok) throw new ApiError(json?.error || 'Falha ao falar com o servidor.', res.status, json?.details);
  return json;
}

export const api = {
  get: (path, params, signal) => request(path, { params, signal }),
  post: (path, body) => request(path, { method: 'POST', body })
};

// Catálogos mudam pouco: uma busca por sessão.
let catalogs;
export function loadCatalogs() {
  if (!catalogs) {
    catalogs = Promise.all([api.get('/materials'), api.get('/regions')])
      .then(([m, r]) => ({ materials: m.data, regions: r.data }))
      .catch((e) => { catalogs = undefined; throw e; });
  }
  return catalogs;
}

export const checkHealth = () => request('/health');
