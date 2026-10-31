import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import { env, isAllowedOrigin } from './config/env.js';
import { logger } from './lib/logger.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // atrás de proxy/CDN em produção

  app.use(pinoHttp({ logger }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)), credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  app.use(compression());
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/admin')) res.set('Cache-Control', 'no-store');
    else if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=30');
    next();
  });
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
