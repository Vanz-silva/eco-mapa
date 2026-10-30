import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
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
