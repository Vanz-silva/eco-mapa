// Converte o mapa da Sema-DF (Google My Maps, exportado em KML) em CSV para o importador.
// Uso:
//   node scripts/sema-kml-to-csv.js data/sema-mapa.kml --list      mostra camadas e exemplos (nada é gravado)
//   node scripts/sema-kml-to-csv.js data/sema-mapa.kml             gera data/pilhas-sema.csv (pilhas e baterias)
//   opções: --with-oleo (inclui óleo de cozinha; gera data/pontos-sema.csv)
//           --skip-near=data/oleo-papa-entulho.geocoded.csv (pula pontos a menos de 150 m dos já existentes)
//           --status=PENDING|VERIFIED (padrão VERIFIED)
// As coordenadas vêm do próprio mapa da Sema (exatas). Nada é inventado.
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from '../src/utils/text.js';
import { insideDF, haversineM } from '../src/utils/geo.js';

const SOURCE = 'Sema-DF, mapeamento dos Pontos de Entrega Voluntária da Logística Reversa (mapa Google My Maps)';
const SOURCE_URL = 'https://www.sema.df.gov.br/pontos-de-coleta';

// Mesmas regiões do seed (nome -> slug). Ordem: nomes mais longos primeiro na busca.
const REGION_NAMES = [
  'Brasília', 'Águas Claras', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Gama', 'Guará', 'Sobradinho', 'Planaltina',
  'Recanto das Emas', 'Santa Maria', 'São Sebastião', 'Vicente Pires', 'Riacho Fundo', 'Núcleo Bandeirante', 'Cruzeiro',
  'Sudoeste/Octogonal', 'Lago Sul', 'Lago Norte', 'Paranoá', 'Itapoã', 'Estrutural', 'Fercal', 'Varjão', 'Candangolândia',
  'Brazlândia', 'Park Way', 'Jardim Botânico', 'Arniqueira', 'Sol Nascente/Pôr do Sol', 'Sobradinho II', 'Riacho Fundo II',
  'SIA', 'Arapoanga', 'Água Quente'
];
const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const REGIONS = REGION_NAMES.flatMap((n) => n.split('/').map((part) => ({ key: norm(part).trim(), slug: slugify(n) })))
  .sort((a, b) => b.key.length - a.key.length);
// Siglas e locais que pertencem ao Plano Piloto (slug "brasilia").
const BRASILIA_ALIASES = ['asa sul', 'asa norte', 'plano piloto', 'esplanada', 'setor comercial sul', 'setor comercial norte', 'eixo monumental', 'sgas', 'sgan', 'sepn', 'sepn ', 'ses ', 'sps ', 'sqs', 'sqn', 'crs', 'crn', 'shcgn', 'shcgs'];

const decode = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const htmlToText = (s) => decode(s).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i')); return m ? m[1] : ''; };

export function parseKml(xml) {
  const folders = [];
  const folderRe = /<Folder[^>]*>([\s\S]*?)<\/Folder>/gi;
  let fm;
  while ((fm = folderRe.exec(xml))) {
    const body = fm[1];
    const firstPm = body.search(/<Placemark/i);
    const head = firstPm === -1 ? body : body.slice(0, firstPm);
    const folder = { name: htmlToText(tag(head, 'name')) || '(sem nome)', placemarks: [] };
    const pmRe = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
    let pm;
    while ((pm = pmRe.exec(body))) {
      const p = pm[1];
      const point = p.match(/<Point>[\s\S]*?<coordinates>\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
      if (!point) continue; // linhas e polígonos não são pontos de coleta
      const data = {};
      for (const d of p.matchAll(/<Data\s+name="([^"]*)"[^>]*>\s*<value>([\s\S]*?)<\/value>/gi)) data[decode(d[1])] = htmlToText(d[2]);
      folder.placemarks.push({ name: htmlToText(tag(p, 'name')), description: htmlToText(tag(p, 'description')), data, lng: Number(point[1]), lat: Number(point[2]) });
    }
    folders.push(folder);
  }
  const rest = xml.replace(/<Folder[^>]*>[\s\S]*?<\/Folder>/gi, '');
  if (/<Placemark/i.test(rest)) {
    const extra = parseKml(`<Folder><name>(sem camada)</name>${rest}</Folder>`)[0];
    if (extra.placemarks.length) folders.push(extra);
  }
  return folders;
}

const line = (text, re) => { const m = text.split('\n').map((l) => l.trim()).find((l) => re.test(l)); return m ? m.replace(re, '').replace(/^[:\-\s]+/, '').trim() : ''; };
const field = (pm, re) => { const k = Object.keys(pm.data).find((x) => re.test(norm(x))); return k ? pm.data[k] : ''; };

function infer(pm) {
  const text = `${pm.name}\n${pm.description}\n${Object.values(pm.data).join('\n')}`;
  let address = field(pm, /endereco|logradouro/) || line(pm.description, /^endere[cç]o\s*:?/i) || pm.description.split('\n')[0] || pm.name;
  const phone = field(pm, /telefone|fone|contato/) || (text.match(/\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/) || [''])[0];
  const hours = field(pm, /horario|funcionamento/) || line(pm.description, /^hor[aá]rio[^:]*:?/i);
  const cep = (text.match(/\b\d{5}-?\d{3}\b/) || [''])[0];
  // Corta frases soltas depois do endereço ("..., Taguatinga. Recebe pilhas"), sem quebrar abreviaturas ("Ed.", "Av.").
  const sentence = address.match(/[A-Za-zÀ-ú]{4,}\.\s+(?=[A-ZÀ-Ú])/);
  if (sentence) {
    const end = sentence.index + sentence[0].indexOf('.');
    if (end >= 10) address = address.slice(0, end);
  }
  return { address: address.slice(0, 250), phone, hours: hours.slice(0, 300), cep };
}

function guessRegion(pm, address) {
  const hay = (s) => ` ${norm(s)} `;
  const sets = [hay(address), hay(`${pm.name} ${pm.description}`)];
  for (const h of sets) {
    for (const r of REGIONS) {
      if (r.slug === 'brasilia' || r.key.length < 4) continue;
      if (new RegExp(`(^|[^a-z0-9])${r.key}([^a-z0-9]|$)`).test(h)) {
        // "Riacho Fundo II" ganha de "Riacho Fundo" (lista ordenada por tamanho)
        return { slug: r.slug, basis: 'texto' };
      }
    }
  }
  const all = sets.join(' ');
  if (BRASILIA_ALIASES.some((a) => all.includes(` ${a.trim()}`)) || all.includes('brasilia')) return { slug: 'brasilia', basis: 'Brasília/Plano Piloto (confira)' };
  return { slug: '', basis: 'não identificada' };
}

function classify(folderName, pm, withOleo) {
  const f = norm(folderName);
  const t = norm(`${pm.name} ${pm.description}`);
  const dry = /pilha|bateria/;
  const oil = /oleo (de cozinha|vegetal|de fritura)|oleo usado/;
  const out = [];
  if (dry.test(f)) out.push('pilhas', 'baterias');
  else if (dry.test(t) && !oil.test(f)) out.push('pilhas', 'baterias'); // citado no texto do ponto
  if (withOleo && (oil.test(f) || oil.test(t))) out.push('oleo-vegetal');
  return [...new Set(out)];
}

// Leitor de CSV mínimo (aspas, vírgulas e quebras de linha), sem dependências.
function readCsv(file) {
  const t = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const [h, ...d] = rows;
  return d.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) { console.error('Uso: node scripts/sema-kml-to-csv.js data/sema-mapa.kml [--list] [--with-oleo] [--status=PENDING|VERIFIED]'); process.exit(1); }
  const withOleo = args.includes('--with-oleo');
  const nearArg = (args.find((a) => a.startsWith('--skip-near=')) || '').split('=')[1];
  const nearPts = nearArg ? readCsv(nearArg).map((r) => ({ lat: Number(r.latitude), lng: Number(r.longitude) })).filter((p) => p.lat && p.lng) : [];
  if (nearArg) console.log(`Pulando pontos a menos de 150 m de ${nearPts.length} ponto(s) de ${nearArg}.`);
  const status = (args.find((a) => a.startsWith('--status=')) || '--status=VERIFIED').split('=')[1];
  const folders = parseKml(fs.readFileSync(file, 'utf8'));
  const total = folders.reduce((n, f) => n + f.placemarks.length, 0);
  console.log(`${folders.length} camada(s), ${total} ponto(s) no mapa.\n`);

  if (args.includes('--list')) {
    for (const f of folders) {
      console.log(`■ Camada "${f.name}": ${f.placemarks.length} ponto(s)`);
      for (const pm of f.placemarks.slice(0, 2)) {
        console.log(`   - ${pm.name} @ ${pm.lat}, ${pm.lng}`);
        console.log(`     descrição: ${pm.description.replace(/\n/g, ' | ').slice(0, 260) || '(vazia)'}`);
        if (Object.keys(pm.data).length) console.log(`     campos: ${JSON.stringify(pm.data).slice(0, 260)}`);
      }
    }
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const H = ['name', 'address', 'region', 'neighborhood', 'postalCode', 'latitude', 'longitude', 'phone', 'openingHours', 'materials', 'description', 'extraInfo', 'source', 'sourceUrl', 'lastUpdated', 'verificationStatus', 'isDemo'];
  const rows = [];
  const seen = new Map();
  const skipped = { layers: new Map(), outsideDF: 0, dup: 0, near: 0 };

  for (const f of folders) {
    for (const pm of f.placemarks) {
      const materials = classify(f.name, pm, withOleo);
      if (!materials.length) { skipped.layers.set(f.name, (skipped.layers.get(f.name) || 0) + 1); continue; }
      if (!insideDF(pm.lat, pm.lng)) { skipped.outsideDF++; console.log(`✗ fora do DF: ${pm.name}`); continue; }
      if (nearPts.some((n) => haversineM(n.lat, n.lng, pm.lat, pm.lng) < 150)) { skipped.near++; continue; }
      const info = infer(pm);
      const k1 = `${norm(pm.name)}|${norm(info.address)}`;
      const k2 = `${norm(pm.name)}|${pm.lat.toFixed(5)},${pm.lng.toFixed(5)}`;
      const prev = seen.get(k1) || seen.get(k2);
      if (prev) { materials.forEach((m) => prev.mats.add(m)); skipped.dup++; continue; } // mesmo ponto em 2 camadas: junta os materiais
      const region = guessRegion(pm, info.address);
      const entry = {
        mats: new Set(materials),
        row: [pm.name || 'Ponto de coleta', info.address, region.slug, '', info.cep, pm.lat.toFixed(6), pm.lng.toFixed(6), info.phone, info.hours,
          materials.join('|'), '', `Ponto de entrega voluntária da logística reversa (camada "${f.name}"). Extraído do mapa da Sema-DF em ${today}.`,
          SOURCE, SOURCE_URL, today, status, 'false'],
        region
      };
      seen.set(k1, entry); seen.set(k2, entry);
      rows.push(entry);
    }
  }

  rows.forEach((r) => { r.row[9] = [...r.mats].join('|'); });
  const out = path.join(path.dirname(file), withOleo ? 'pontos-sema.csv' : 'pilhas-sema.csv');
  fs.writeFileSync(out, [H.join(','), ...rows.map((r) => r.row.map(esc).join(','))].join('\n') + '\n', 'utf8');

  const noRegion = rows.filter((r) => !r.region.slug).length;
  const weak = rows.filter((r) => r.region.slug === 'brasilia' && r.region.basis !== 'texto').length;
  console.log(`${rows.length} ponto(s) gravados em ${out}`);
  console.log(`  região identificada pelo texto: ${rows.length - noRegion - weak} | por "Brasília/Plano Piloto" (confira): ${weak} | sem região: ${noRegion}`);
  console.log(`  repetidos unidos: ${skipped.dup} | fora do DF: ${skipped.outsideDF} | já existentes (<150 m): ${skipped.near}`);
  for (const [name, n] of skipped.layers) console.log(`  camada ignorada (outros materiais): "${name}" (${n})`);
  console.log('\nPrimeiros pontos:');
  rows.slice(0, 8).forEach((r) => console.log(`  - ${r.row[0]} | ${r.row[1]} | região: ${r.row[2] || '—'} | ${r.row[5]}, ${r.row[6]}`));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
