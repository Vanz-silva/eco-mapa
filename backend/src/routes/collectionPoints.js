import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { HttpError } from '../middlewares/errors.js';
import { sanitize } from '../utils/text.js';
import { insideDF } from '../utils/geo.js';
import * as svc from '../services/pointsService.js';

const router = Router();

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const slug = z.string().regex(/^[a-z0-9-]+$/).max(60);
const q = z.string().min(2).max(100).transform(sanitize).pipe(z.string().min(2));

const listQ = z.object({ material: slug.optional(), region: slug.optional(), page, limit });
const nearbyQ = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(100).optional(), // omitido = todas as distâncias
  material: slug.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});
const searchQ = z.object({ q, material: slug.optional(), page, limit });
const suggestQ = z.object({ q });
const idP = z.object({ id: z.string().uuid() });

router.get('/', validate(listQ), async (req, res, next) => {
  try { res.json(await svc.list(req.valid.query)); } catch (e) { next(e); }
});

router.get('/nearby', validate(nearbyQ), async (req, res, next) => {
  try {
    const { lat, lng } = req.valid.query;
    const data = await svc.nearby(req.valid.query);
    // Origem fora do DF ainda funciona, mas o cliente pode avisar o usuário.
    res.json({ data, meta: { total: data.length, originInsideDF: insideDF(lat, lng) } });
  } catch (e) { next(e); }
});

router.get('/search', validate(searchQ), async (req, res, next) => {
  try { res.json(await svc.search(req.valid.query)); } catch (e) { next(e); }
});

router.get('/suggest', validate(suggestQ), async (req, res, next) => {
  try { res.json(await svc.suggest(req.valid.query.q)); } catch (e) { next(e); }
});

// Deve ficar por último para não capturar /nearby, /search, /suggest.
router.get('/:id', validate(idP, 'params'), async (req, res, next) => {
  try {
    const p = await svc.getById(req.valid.params.id);
    if (!p) throw new HttpError(404, 'Ponto de coleta não encontrado.');
    res.json({ data: p });
  } catch (e) { next(e); }
});

export default router;
