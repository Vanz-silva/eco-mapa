import { Router } from 'express';
import collectionPoints from './collectionPoints.js';
import suggestions from './suggestions.js';
import routeRouter from './route.js';
import { materialsRouter, regionsRouter } from './catalog.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
router.use('/collection-points', collectionPoints);
router.use('/materials', materialsRouter);
router.use('/regions', regionsRouter);
router.use('/suggestions', suggestions);
router.use('/route', routeRouter);
export default router;
