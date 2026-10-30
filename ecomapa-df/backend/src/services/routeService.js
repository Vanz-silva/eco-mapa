import { env } from '../config/env.js';
import { cached } from '../utils/cache.js';
import { HttpError } from '../middlewares/errors.js';

// No servidor FOSSGIS o perfil vem do prefixo do caminho; o segmento "driving" é sempre o mesmo.
const PREFIX = { driving: 'routed-car', cycling: 'routed-bike', walking: 'routed-foot' };
const MAX_POINTS = 1200;

// Política do servidor público: no máximo ~1 requisição por segundo.
let chain = Promise.resolve();
let lastCall = 0;
let pending = 0;
function throttle() {
  if (pending >= 10) throw new HttpError(503, 'Serviço de rotas ocupado. Tente novamente em instantes.');
  pending++;
  const turn = chain.then(async () => {
    const wait = lastCall + 1000 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
  });
  chain = turn.catch(() => {});
  return turn.finally(() => { pending--; });
}

const r4 = (n) => n.toFixed(4); // ~11 m: rotas quase idênticas compartilham cache

function decimate(coords) {
  if (coords.length <= MAX_POINTS) return coords;
  const step = Math.ceil(coords.length / MAX_POINTS);
  const out = coords.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== coords[coords.length - 1]) out.push(coords[coords.length - 1]);
  return out;
}

export async function getRoute({ from, to, mode }) {
  const key = `route:${mode}:${r4(from.lat)},${r4(from.lng)}:${r4(to.lat)},${r4(to.lng)}`;
  return cached(key, 10 * 60_000, async () => {
    await throttle();
    const url =
      `${env.OSRM_BASE_URL}/${PREFIX[mode]}/route/v1/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=false&steps=false`;

    let res;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': env.HTTP_USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
    } catch {
      throw new HttpError(502, 'Serviço de rotas indisponível no momento.');
    }

    let json = null;
    try { json = await res.json(); } catch { /* resposta inválida */ }
    if (json?.code === 'NoRoute') throw new HttpError(404, 'Não foi possível traçar uma rota até esse ponto neste modo.');
    if (!res.ok || json?.code !== 'Ok' || !json.routes?.[0]) {
      throw new HttpError(502, 'Serviço de rotas indisponível no momento.');
    }

    const route = json.routes[0];
    return {
      mode,
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
      coordinates: decimate(route.geometry.coordinates.map(([lng, lat]) => [lat, lng])),
      provider: 'OSRM (FOSSGIS) · © OpenStreetMap'
    };
  });
}
