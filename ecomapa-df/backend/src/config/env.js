import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  // Opcional: sem ele o painel admin fica desativado e o mapa público funciona normalmente.
  JWT_SECRET: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(32, 'JWT_SECRET precisa ter ao menos 32 caracteres (openssl rand -hex 48)').optional()),
  JWT_EXPIRES_HOURS: z.coerce.number().int().min(1).max(72).default(8),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  INCLUDE_DEMO: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  LOG_LEVEL: z.string().default('info'),
  // Servidor OSRM com prefixos routed-car / routed-bike / routed-foot (layout FOSSGIS)
  OSRM_BASE_URL: z.string().url().default('https://routing.openstreetmap.de'),
  // Identifica a aplicação nos serviços públicos de mapas (exigido pela política deles)
  HTTP_USER_AGENT: z.string().default('EcoMapaDF/0.3')
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
};

// Em desenvolvimento aceita qualquer porta local (o Next muda para 3001 se a 3000 estiver ocupada).
export function isAllowedOrigin(origin) {
  if (env.corsOrigins.includes(origin)) return true;
  return env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
}
