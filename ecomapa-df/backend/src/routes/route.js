import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../middlewares/validate.js';
import { HttpError } from '../middlewares/errors.js';
import { haversineM } from '../utils/geo.js';
import * as points from '../services/pointsService.js';
import { getRoute } from '../services/routeService.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas rotas solicitadas. Aguarde um instante.' }
});

const MAX_DISTANCE_M = 300_000; // evita uso do endpoint como proxy genérico de rotas

const query = z.object({
  pointId: z.string().uuid(),
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  mode: z.enum(['driving', 'cycling', 'walking']).default('driving')
});

// O destino é sempre um ponto público cadastrado, nunca coordenadas livres.
router.get('/', limiter, validate(query), async (req, res, next) => {
  try {
    const { pointId, fromLat, fromLng, mode } = req.valid.query;
    const point = await points.getById(pointId);
    if (!point) throw new HttpError(404, 'Ponto de coleta não encontrado.');
    if (haversineM(fromLat, fromLng, point.latitude, point.longitude) > MAX_DISTANCE_M) {
      throw new HttpError(422, 'Sua localização está longe demais para calcular a rota.');
    }
    const data = await getRoute({
      from: { lat: fromLat, lng: fromLng },
      to: { lat: point.latitude, lng: point.longitude },
      mode
    });
    res.set('Cache-Control', 'private, max-age=60');
    res.json({ data });
  } catch (e) { next(e); }
});

export default router;
