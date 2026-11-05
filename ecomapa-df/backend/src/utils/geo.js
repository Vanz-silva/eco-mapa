// Caixa delimitadora aproximada do Distrito Federal (margem generosa).
// Serve como trava contra coordenadas trocadas/erradas, não como validação fina.
export const DF_BBOX = {
  minLat: -16.1,
  maxLat: -15.45,
  minLng: -48.3,
  maxLng: -47.25,
};

export function insideDF(lat, lng) {
  return (
    lat >= DF_BBOX.minLat &&
    lat <= DF_BBOX.maxLat &&
    lng >= DF_BBOX.minLng &&
    lng <= DF_BBOX.maxLng
  );
}

// Calcula a distância entre duas coordenadas em metros.
export function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const toRad = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
