// Caixa delimitadora aproximada do Distrito Federal (margem generosa).
// Serve como trava contra coordenadas trocadas/erradas, não como validação fina.
export const DF_BBOX = { minLat: -16.1, maxLat: -15.45, minLng: -48.3, maxLng: -47.25 };

export function insideDF(lat, lng) {
  return lat >= DF_BBOX.minLat && lat <= DF_BBOX.maxLat && lng >= DF_BBOX.minLng && lng <= DF_BBOX.maxLng;
}
