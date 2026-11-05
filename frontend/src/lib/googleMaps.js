import { Loader } from '@googlemaps/js-api-loader';

// A chave fica no navegador por natureza: proteja-a com restrição de sites (HTTP referrer) no Google Cloud.
export const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
// Marcadores personalizados exigem um Map ID. DEMO_MAP_ID serve só para testes; crie o seu para produção.
export const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

let loader;
export function loadGoogleMaps() {
  if (!GOOGLE_KEY) return Promise.reject(new Error('NO_KEY'));
  loader = loader || new Loader({ apiKey: GOOGLE_KEY, version: 'weekly', language: 'pt-BR', region: 'BR' });
  return Promise.all([loader.importLibrary('maps'), loader.importLibrary('marker')]);
}
