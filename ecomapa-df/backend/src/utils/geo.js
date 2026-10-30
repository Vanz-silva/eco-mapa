// Caixa delimitadora aproximada do Distrito Federal (margem generosa).
// Serve como trava contra coordenadas trocadas/erradas, não como validação fina.
export const DF_BBOX = { minLat: -16.1, maxLat: -15.45, minLng: -48.3, maxLng: -47.25 };

// Distância em metros entre dois pontos (fórmula de haversine).
export function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function insideDF(lat, lng) {
  return lat >= DF_BBOX.minLat && lat <= DF_BBOX.maxLat && lng >= DF_BBOX.minLng && lng <= DF_BBOX.maxLng;
}
