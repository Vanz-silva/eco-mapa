// Preenche latitude/longitude do CSV de Papa-Entulhos usando os links "Google Maps"/"Waze"
// da própria página do SLU (https://www.slu.df.gov.br/papa-entulho), que trazem a posição exata.
// Uso: node scripts/fill-coords-slu.js data/slu-papa-entulho.html data/oleo-papa-entulho.csv
// Gera data/oleo-papa-entulho.geocoded.csv (a ordem das linhas do CSV = numeração 01..28 do SLU).
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { insideDF } from '../src/utils/geo.js';

const [htmlFile, csvFile] = process.argv.slice(2);
if (!htmlFile || !csvFile) {
  console.error('Uso: node scripts/fill-coords-slu.js <pagina-do-slu.html> <csv>');
  process.exit(1);
}

// Extrai { numero -> {lat,lng} } de cada linha <tr> da tabela.
export function extractCoords(html) {
  const out = new Map();
  for (const chunk of html.split(/<tr[\s>]/i).slice(1)) {
    const num = chunk.match(/<td[^>]*>\s*(\d{2})\s*<\/td>/i);
    const g = chunk.match(/loc:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || chunk.match(/[?&;]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (num && g) out.set(Number(num[1]), { lat: Number(g[1]), lng: Number(g[2]) });
  }
  return out;
}

const coords = extractCoords(fs.readFileSync(htmlFile, 'utf8'));
console.log(`${coords.size} coordenadas encontradas na página do SLU.`);

const rows = parse(fs.readFileSync(csvFile, 'utf8'), { columns: true, skip_empty_lines: true, trim: true, bom: true });
const headers = Object.keys(rows[0]);
let ok = 0;
rows.forEach((r, i) => {
  const c = coords.get(i + 1);
  if (!c || !insideDF(c.lat, c.lng)) {
    console.log(`✗ ${String(i + 1).padStart(2, '0')} ${r.name}: sem coordenada válida (preencha à mão)`);
    return;
  }
  r.latitude = c.lat.toFixed(6);
  r.longitude = c.lng.toFixed(6);
  ok++;
  console.log(`✓ ${String(i + 1).padStart(2, '0')} ${r.name}  →  ${r.latitude}, ${r.longitude}`);
});

const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const out = path.join(path.dirname(csvFile), path.basename(csvFile, '.csv') + '.geocoded.csv');
fs.writeFileSync(out, [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n') + '\n', 'utf8');
console.log(`\n${ok}/${rows.length} preenchidos. Arquivo: ${out}`);
