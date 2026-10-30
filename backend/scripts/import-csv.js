// Uso: npm run import:csv -- data/arquivo.csv [--dry-run]
// Importa pontos de coleta de um CSV. Cada linha precisa de FONTE e DATA;
// coordenadas fora do DF são rejeitadas. Nada é inventado ou completado.
import 'dotenv/config';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { insideDF } from '../src/utils/geo.js';
import { sanitize, onlyDigits } from '../src/utils/text.js';

const prisma = new PrismaClient();
const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dryRun = process.argv.includes('--dry-run');
if (!file) {
  console.error('Informe o CSV: npm run import:csv -- data/arquivo.csv [--dry-run]');
  process.exit(1);
}

const opt = z.string().transform((s) => sanitize(s) || undefined).optional();
const row = z.object({
  name: z.string().transform(sanitize).pipe(z.string().min(3)),
  address: z.string().transform(sanitize).pipe(z.string().min(5)),
  region: z.string().min(1), // slug da região
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  materials: z.string().min(1), // ex.: pilhas|baterias
  source: z.string().transform(sanitize).pipe(z.string().min(3)),
  lastUpdated: z.coerce.date(), // YYYY-MM-DD
  description: opt,
  neighborhood: opt,
  openingHours: opt,
  extraInfo: opt,
  sourceUrl: z.string().url().optional().or(z.literal('')),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
  isDemo: z.enum(['true', 'false', '']).default('false')
});

const records = parse(fs.readFileSync(file, 'utf8'), { columns: true, skip_empty_lines: true, trim: true, bom: true });
const regions = new Map((await prisma.region.findMany()).map((r) => [r.slug, r.id]));
const materials = new Map((await prisma.material.findMany()).map((m) => [m.slug, m.id]));

let ok = 0;
let failed = 0;
for (const [i, raw] of records.entries()) {
  const line = i + 2; // +1 cabeçalho, +1 base 1
  try {
    const r = row.parse(raw);
    if (!insideDF(r.latitude, r.longitude)) throw new Error('coordenadas fora do Distrito Federal (lat/lng trocados?)');
    const regionId = regions.get(r.region);
    if (!regionId) throw new Error(`região desconhecida: "${r.region}"`);
    const slugs = r.materials.split('|').map((s) => s.trim()).filter(Boolean);
    const materialIds = slugs.map((s) => {
      if (!materials.has(s)) throw new Error(`material desconhecido: "${s}"`);
      return materials.get(s);
    });

    const data = {
      name: r.name, address: r.address, regionId, description: r.description, neighborhood: r.neighborhood,
      postalCode: onlyDigits(r.postalCode) || null, latitude: r.latitude, longitude: r.longitude,
      phone: onlyDigits(r.phone) || null, openingHours: r.openingHours, extraInfo: r.extraInfo,
      source: r.source, sourceUrl: r.sourceUrl || null, lastUpdated: r.lastUpdated,
      verificationStatus: r.verificationStatus, isDemo: r.isDemo === 'true'
    };
    if (!dryRun) {
      const point = await prisma.collectionPoint.upsert({
        where: { name_address: { name: r.name, address: r.address } },
        update: data,
        create: data
      });
      await prisma.collectionPointMaterial.deleteMany({ where: { pointId: point.id } });
      await prisma.collectionPointMaterial.createMany({
        data: materialIds.map((materialId) => ({ pointId: point.id, materialId }))
      });
    }
    ok++;
  } catch (e) {
    failed++;
    console.error(`Linha ${line}: ${e.flatten ? JSON.stringify(e.flatten().fieldErrors) : e.message}`);
  }
}
console.log(`${dryRun ? '[dry-run] ' : ''}${ok} importados, ${failed} com erro.`);
await prisma.$disconnect();
process.exit(failed ? 2 : 0);
