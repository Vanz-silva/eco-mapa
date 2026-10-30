// Cor/estilo do marcador: roxo (pilhas/baterias), azul (óleo) ou misto.
export function pinKind(materials) {
  const slugs = materials.map((m) => m.slug);
  const oil = slugs.includes('oleo-vegetal');
  const dry = slugs.includes('pilhas') || slugs.includes('baterias');
  if (oil && dry) return 'mixed';
  return oil ? 'cyan' : 'purple';
}

// Navegação externa (a rota desenhada no mapa vem na Fase 3).
export function googleDirections(p, origin) {
  const u = new URL('https://www.google.com/maps/dir/');
  u.searchParams.set('api', '1');
  u.searchParams.set('destination', `${p.latitude},${p.longitude}`);
  if (origin) u.searchParams.set('origin', `${origin.lat},${origin.lng}`);
  return u.toString();
}

export function osmLink(p, origin) {
  if (origin) {
    return `https://www.openstreetmap.org/directions?route=${origin.lat}%2C${origin.lng}%3B${p.latitude}%2C${p.longitude}`;
  }
  return `https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=17/${p.latitude}/${p.longitude}`;
}
