-- Executar depois do "prisma migrate dev" (npm run db:postgis). Idempotente.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice espacial por expressão: não precisa de coluna geography separada,
-- então latitude/longitude continuam sendo a única fonte da verdade.
CREATE INDEX IF NOT EXISTS collection_point_geog_gist
  ON "CollectionPoint"
  USING GIST ((ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography));
