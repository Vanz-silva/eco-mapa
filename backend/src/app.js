import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // atrás de proxy/CDN em produção

  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, methods: ['GET', 'POST'] }));
  app.use(compression());
  app.use(express.json({ limit: '50kb' }));

  app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=30');
    next();
  });
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
