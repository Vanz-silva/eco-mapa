import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { cached } from '../utils/cache.js';
import { visibleWhere } from '../services/pointsService.js';

export const materialsRouter = Router();
export const regionsRouter = Router();

materialsRouter.get('/', async (_req, res, next) => {
  try {
    const data = await cached('materials', 5 * 60_000, () => prisma.material.findMany({ orderBy: { id: 'asc' } }));
    res.json({ data });
  } catch (e) { next(e); }
});

// Inclui pointCount (só pontos públicos) para a UI poder esmaecer regiões sem dados.
regionsRouter.get('/', async (_req, res, next) => {
  try {
    const data = await cached('regions', 60_000, async () => {
      const [regions, counts] = await Promise.all([
        prisma.region.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
        prisma.collectionPoint.groupBy({ by: ['regionId'], where: visibleWhere(), _count: { _all: true } })
      ]);
      const map = new Map(counts.map((c) => [c.regionId, c._count._all]));
      return regions.map((r) => ({ ...r, pointCount: map.get(r.id) ?? 0 }));
    });
    res.json({ data });
  } catch (e) { next(e); }
});
