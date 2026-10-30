import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { escapeLike, onlyDigits } from '../utils/text.js';

const include = {
  region: { select: { name: true, slug: true } },
  materials: { include: { material: { select: { slug: true, name: true, icon: true, color: true } } } }
};

// Regra de visibilidade pública: só verificados; demonstração só se INCLUDE_DEMO=true.
export const visibleWhere = () => ({
  verificationStatus: 'VERIFIED',
  ...(env.INCLUDE_DEMO ? {} : { isDemo: false })
});
const visibleSql = () =>
  env.INCLUDE_DEMO
    ? Prisma.sql`p."verificationStatus" = 'VERIFIED'`
    : Prisma.sql`p."verificationStatus" = 'VERIFIED' AND p."isDemo" = false`;

export function serialize(p, distanceM) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    address: p.address,
    city: p.city,
    neighborhood: p.neighborhood,
    postalCode: p.postalCode,
    region: p.region,
    latitude: p.latitude,
    longitude: p.longitude,
    phone: p.phone,
    openingHours: p.openingHours,
    extraInfo: p.extraInfo,
    materials: p.materials.map((m) => m.material),
    source: p.source,
    sourceUrl: p.sourceUrl,
    verificationStatus: p.verificationStatus,
    isDemo: p.isDemo,
    lastUpdated: p.lastUpdated,
    ...(distanceM != null ? { distanceM: Math.round(distanceM), distanceKm: Math.round(distanceM / 100) / 10 } : {})
  };
}

// Carrega os registros completos preservando a ordem dos ids recebidos.
async function hydrate(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const found = await prisma.collectionPoint.findMany({ where: { id: { in: ids } }, include });
  const byId = new Map(found.map((p) => [p.id, p]));
  return rows.filter((r) => byId.has(r.id)).map((r) => serialize(byId.get(r.id), r.distanceM));
}

const meta = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

const materialSqlFor = (material) =>
  material
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM "CollectionPointMaterial" cm JOIN "Material" m ON m.id = cm."materialId"
                             WHERE cm."pointId" = p.id AND m.slug = ${material})`
    : Prisma.empty;

export async function list({ material, region, page, limit }) {
  const where = {
    ...visibleWhere(),
    ...(region ? { region: { slug: region } } : {}),
    ...(material ? { materials: { some: { material: { slug: material } } } } : {})
  };
  const [total, items] = await Promise.all([
    prisma.collectionPoint.count({ where }),
    prisma.collectionPoint.findMany({ where, include, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit })
  ]);
  return { data: items.map((p) => serialize(p)), meta: meta(page, limit, total) };
}

export async function getById(id) {
  const p = await prisma.collectionPoint.findFirst({ where: { id, ...visibleWhere() }, include });
  return p ? serialize(p) : null;
}

export async function nearby({ lat, lng, radiusKm, material, limit }) {
  const origin = Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography`;
  const geog = Prisma.sql`ST_SetSRID(ST_MakePoint(p."longitude", p."latitude"), 4326)::geography`;
  const radiusSql = radiusKm ? Prisma.sql`AND ST_DWithin(${geog}, ${origin}, ${radiusKm * 1000}::float8)` : Prisma.empty;

  const rows = await prisma.$queryRaw`
    SELECT p.id, ST_Distance(${geog}, ${origin}) AS "distanceM"
    FROM "CollectionPoint" p
    WHERE ${visibleSql()} ${radiusSql} ${materialSqlFor(material)}
    ORDER BY "distanceM" ASC
    LIMIT ${limit}`;
  return hydrate(rows.map((r) => ({ id: r.id, distanceM: Number(r.distanceM) })));
}

export async function search({ q, material, page, limit }) {
  const like = `%${escapeLike(q)}%`;
  const digits = onlyDigits(q);
  const cepSql = digits.length >= 5 ? Prisma.sql`OR p."postalCode" LIKE ${digits + '%'}` : Prisma.empty;

  const rows = await prisma.$queryRaw`
    SELECT p.id, COUNT(*) OVER() AS total
    FROM "CollectionPoint" p
    LEFT JOIN "Region" r ON r.id = p."regionId"
    WHERE ${visibleSql()} ${materialSqlFor(material)}
      AND (
        unaccent(lower(p."name")) LIKE unaccent(lower(${like}))
        OR unaccent(lower(p."address")) LIKE unaccent(lower(${like}))
        OR unaccent(lower(coalesce(p."neighborhood", ''))) LIKE unaccent(lower(${like}))
        OR unaccent(lower(coalesce(r."name", ''))) LIKE unaccent(lower(${like}))
        ${cepSql}
      )
    ORDER BY p."name" ASC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
  const total = rows.length ? Number(rows[0].total) : 0;
  return { data: await hydrate(rows.map((r) => ({ id: r.id }))), meta: meta(page, limit, total) };
}

// Autocomplete: regiões + pontos (máx. 5 de cada).
export async function suggest(q) {
  const like = `%${escapeLike(q)}%`;
  const [regions, points] = await Promise.all([
    prisma.$queryRaw`
      SELECT name, slug, latitude, longitude FROM "Region"
      WHERE active = true AND unaccent(lower(name)) LIKE unaccent(lower(${like}))
      ORDER BY name LIMIT 5`,
    prisma.$queryRaw`
      SELECT p.id, p."name", p."address" FROM "CollectionPoint" p
      WHERE ${visibleSql()} AND unaccent(lower(p."name")) LIKE unaccent(lower(${like}))
      ORDER BY p."name" LIMIT 5`
  ]);
  return {
    regions: regions.map((r) => ({ type: 'region', ...r })),
    points: points.map((p) => ({ type: 'point', ...p }))
  };
}
