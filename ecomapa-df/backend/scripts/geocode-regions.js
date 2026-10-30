// Preenche latitude/longitude das regiões administrativas usando o Nominatim (OSM).
// Uso: npm run geocode:regions -- [--dry-run] [--force]
//   --dry-run  só mostra o resultado, sem gravar
//   --force    refaz também as regiões que já têm coordenadas
// Política do Nominatim: 1 req/s, User-Agent com contato (NOMINATIM_CONTACT no .env) e cache.
// CONFIRA o resultado no mapa: o Nominatim pode devolver o centro errado para nomes ambíguos.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { insideDF } from '../src/utils/geo.js';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');
const contact = process.env.NOMINATIM_CONTACT;
if (!contact) {
  console.error('Defina NOMINATIM_CONTACT no .env (e-mail ou URL do projeto). A política do Nominatim exige identificação.');
  process.exit(1);
}

const prisma = new PrismaClient();
const UA = `${process.env.HTTP_USER_AGENT || 'EcoMapaDF/0.3'} (${contact})`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const regions = await prisma.region.findMany({ where: force ? {} : { latitude: null }, orderBy: { name: 'asc' } });
console.log(`${regions.length} região(ões) para geocodificar${dryRun ? ' [dry-run]' : ''}.\n`);

let ok = 0;
for (const r of regions) {
  const place = r.name.split('/')[0].trim(); // "Sudoeste/Octogonal" -> "Sudoeste"
  const q = `${place}, Distrito Federal, Brasil`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const [hit] = await res.json();
    if (!hit) { console.log(`✗ ${r.name}: sem resultado`); }
    else {
      const lat = Number(hit.lat), lng = Number(hit.lon);
      if (!insideDF(lat, lng)) console.log(`✗ ${r.name}: resultado fora do DF (${hit.display_name})`);
      else {
        console.log(`✓ ${r.name}: ${lat.toFixed(5)}, ${lng.toFixed(5)}  ← ${hit.display_name}`);
        if (!dryRun) await prisma.region.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
        ok++;
      }
    }
  } catch (e) {
    console.log(`✗ ${r.name}: ${e.message}`);
  }
  await sleep(1100);
}
console.log(`\n${ok}/${regions.length} ${dryRun ? 'encontradas' : 'gravadas'}. Revise as linhas acima no mapa antes de publicar.`);
await prisma.$disconnect();
