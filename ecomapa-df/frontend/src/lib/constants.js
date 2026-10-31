// Vista inicial do mapa (visão geral do DF). Não é um ponto de coleta.
export const DF_CENTER = [-15.7801, -47.9292];
export const DF_ZOOM = 10;

export const DISTANCES = [
  { value: '', label: 'Todas' },
  { value: '1', label: 'Até 1 km' },
  { value: '5', label: 'Até 5 km' },
  { value: '10', label: 'Até 10 km' },
  { value: '20', label: 'Até 20 km' }
];

export const MATERIAL_COLORS = { pilhas: '#8B5CF6', baterias: '#8B5CF6', 'oleo-vegetal': '#00D9FF' };

// Tiles do mapa: padrão = OpenStreetMap, gratuito e SEM chave de API.
// Para outro provedor, defina NEXT_PUBLIC_TILE_URL (e NEXT_PUBLIC_TILE_ATTRIBUTION) no .env.local.
export const TILE_URL = process.env.NEXT_PUBLIC_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// O filtro escurece tiles claros (visual dark). Desligado automaticamente se você usar um provedor próprio.
export const TILE_DARK_FILTER =
  (process.env.NEXT_PUBLIC_TILE_FILTER ?? (process.env.NEXT_PUBLIC_TILE_URL ? 'false' : 'true')) === 'true';
