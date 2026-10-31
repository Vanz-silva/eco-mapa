import { Router } from 'express';
import { originGuard, requireAuth } from '../../middlewares/auth.js';
import { HttpError } from '../../middlewares/errors.js';
import { env } from '../../config/env.js';
import { publicAuth, sessionAuth } from './auth.js';
import stats from './stats.js';
import points from './points.js';
import suggestions from './suggestions.js';
import geocode from './geocode.js';
import { materialsAdmin, regionsAdmin } from './catalog.js';

const router = Router();
// Sem JWT_SECRET o painel fica desligado; o site público não é afetado.
router.use((_req, _res, next) => (env.JWT_SECRET ? next() : next(new HttpError(503, 'Painel administrativo desativado.'))));
router.use(originGuard);
router.use(publicAuth); // POST /login (sem sessão)

router.use(requireAuth); // tudo abaixo exige login
router.use(sessionAuth); // GET /me, POST /logout
router.use('/stats', stats);
router.use('/points', points);
router.use('/suggestions', suggestions);
router.use('/materials', materialsAdmin);
router.use('/regions', regionsAdmin);
router.use('/geocode', geocode);

export default router;
