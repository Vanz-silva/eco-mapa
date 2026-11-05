// Preenche latitude/longitude de um CSV de pontos a partir do endereço (Nominatim/OSM).
// Uso: npm run geocode:csv -- data/arquivo.csv [--force]
// Gera data/arquivo.geocoded.csv e imprime, para CADA ponto, o endereço que o Nominatim encontrou
// e um link do OpenStreetMap. CONFIRA os links: endereços de quadras/áreas especiais do DF costumam
// ser aproximados. Linhas sem resultado ficam vazias para você preencher à mão (ou pelo painel).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { insideDF } from '../src/utils/geo.js';

const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const force = process.argv.includes('--force');
const contact = process.env.NOMINATIM_CONTACT;
if (!file) { console.error('Uso: npm run geocode:csv -- data/arquivo.csv [--force]'); process.exit(1); }
if (!contact) { console.error('Defina NOMINATIM_CONTACT no .env (seu e-mail). A política do Nominatim exige identificação.'); process.exit(1); }

const prisma = new PrismaClient();
const UA = `${process.env.HTTP_USER_AGENT || 'EcoMapaDF/0.3'} (${contact})`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const regionNames = new Map((await prisma.region.findMany()).map((r) => [r.slug, r.name]));
await prisma.$disconnect();

async function search(q) {
  const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
    format: 'jsonv2', limit: '3', countrycodes: 'br', q, viewbox: '-48.3,-15.45,-47.25,-16.1', bounded: '1'
  });
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR' }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const hits = await res.json();
  return hits.map((h) => ({ lat: Number(h.lat), lng: Number(h.lon), label: h.display_name })).find((h) => insideDF(h.lat, h.lng));
}

const text = fs.readFileSync(file, 'utf8');
const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
const headers = Object.keys(rows[0] || {});
let found = 0, missing = 0;

for (const r of rows) {
  if (!force && r.latitude && r.longitude) continue;
  const region = regionNames.get(r.region) || r.region;
  const noParens = r.address.replace(/\s*\([^)]*\)/g, '');
  const queries = [...new Set([
    `${r.address}, ${region}, Distrito Federal, Brasil`,
    `${noParens}, ${region}, Distrito Federal, Brasil`,
    `${r.name.replace(/\s*\([^)]*\)/g, '')}, ${region}, Distrito Federal, Brasil`
  ])];
  let hit = null;
  for (const q of queries) {
    try { hit = await search(q); } catch (e) { console.log(`  (erro na busca: ${e.message})`); }
    await sleep(1100);
    if (hit) break;
  }
  if (hit) {
    r.latitude = hit.lat.toFixed(6);
    r.longitude = hit.lng.toFixed(6);
    found++;
    console.log(`✓ ${r.name}\n    ${r.latitude}, ${r.longitude}  ←  ${hit.label}\n    https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=18/${r.latitude}/${r.longitude}`);
  } else {
    missing++;
    console.log(`✗ ${r.name}: sem resultado. Preencha latitude/longitude manualmente.`);
  }
}

const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const out = path.join(path.dirname(file), path.basename(file, '.csv') + '.geocoded.csv');
fs.writeFileSync(out, [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n') + '\n', 'utf8');
console.log(`\n${found} encontrados, ${missing} sem resultado. Arquivo: ${out}`);
console.log('Abra cada link, confira se o marcador cai no local certo e corrija o CSV antes de importar.');
