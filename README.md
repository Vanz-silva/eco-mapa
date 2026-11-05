# EcoMapa DF

Plataforma de pontos de coleta de pilhas, baterias e óleo vegetal usado no Distrito Federal.

## Estrutura
```
ecomapa-df/
├── docker-compose.yml     PostgreSQL + PostGIS local
├── backend/               API Express + Prisma (Fase 1, pronta)
├── frontend/              Next.js + mapa (Fase 2)
└── docs/                  fontes de dados
```

## Rodando o backend (Fase 1)
Requisitos: Node 20+, Docker.

```bash
docker compose up -d                 # sobe o banco
cd backend
cp .env.example .env
npm install
npm run setup                        # generate + migrate + PostGIS + seed (materiais e regiões)
npm run dev                          # http://localhost:4000/api/health
```

## Endpoints (públicos)
| Método | Rota | Parâmetros |
|---|---|---|
| GET | `/api/collection-points` | `material`, `region`, `page`, `limit` |
| GET | `/api/collection-points/nearby` | `lat`, `lng`, `radiusKm?`, `material?`, `limit?` |
| GET | `/api/collection-points/search` | `q`, `material?`, `page`, `limit` |
| GET | `/api/collection-points/suggest` | `q` (autocomplete) |
| GET | `/api/collection-points/:id` | |
| GET | `/api/materials` · `/api/regions` | |
| POST | `/api/suggestions` | `name, address, materials[], region?, phone?, notes?` |

`material` usa slugs: `pilhas`, `baterias`, `oleo-vegetal`. `region` usa o slug (ex.: `taguatinga`).

## Rotas e geocodificação (Fase 3)
- `GET /api/route?pointId=&fromLat=&fromLng=&mode=driving|cycling|walking`: rota via OSRM (servidor público FOSSGIS, uso razoável, máx. 1 req/s). O destino é sempre um ponto cadastrado. Configure `OSRM_BASE_URL` e `HTTP_USER_AGENT` no `.env`; em produção, hospede seu próprio OSRM.
- `npm run geocode:regions -- --dry-run`: obtém o centro de cada região no Nominatim (precisa de `NOMINATIM_CONTACT` no `.env`). Revise a saída e rode sem `--dry-run` para gravar.

## Painel administrativo (Fase 4)
- Requer `JWT_SECRET` (mín. 32 caracteres) no `backend/.env`. Gere com `openssl rand -hex 48`.
- Crie o primeiro usuário: `npm run admin:create` (use `-- --role=EDITOR` para um editor). A senha é digitada de forma oculta.
- Acesse `http://localhost:3000/admin`. ADMIN pode tudo; EDITOR cadastra/edita pontos, verifica e trata sugestões, mas não exclui nem altera materiais/regiões.
- Sessão em cookie httpOnly (não acessível por JavaScript), com limite de tentativas de login e checagem de origem nas alterações.

## Dados
Pontos já pesquisados (veja `docs/pontos-pesquisados.md`): `backend/data/oleo-papa-entulho.csv` e `backend/data/pilhas-green-eletron-a-confirmar.csv`. Fluxo:
```bash
cd backend
# 1. NOMINATIM_CONTACT=seu-email no .env  (exigência do Nominatim)
npm run geocode:csv -- data/oleo-papa-entulho.csv     # gera oleo-papa-entulho.geocoded.csv
# 2. abra os links impressos, confira cada marcador e corrija o CSV se preciso
npm run import:csv -- data/oleo-papa-entulho.geocoded.csv --dry-run
npm run import:csv -- data/oleo-papa-entulho.geocoded.csv
```
O banco começa **sem pontos**. Veja `docs/fontes-de-dados.md` e importe por CSV:
`npm run import:csv -- data/arquivo.csv --dry-run`.
Pontos só aparecem na API quando `VERIFIED`; os de demonstração (`isDemo`) ficam ocultos, a menos que `INCLUDE_DEMO=true`.

## Roadmap
1. Banco, API e importador (esta entrega)
2. Frontend: mapa neon, clustering, filtros, busca, geolocalização
3. Rotas (OSRM) e geocodificação das regiões (esta entrega)
4. Painel administrativo com autenticação (esta entrega)
