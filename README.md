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

## Dados
O banco começa **sem pontos**. Veja `docs/fontes-de-dados.md` e importe por CSV:
`npm run import:csv -- data/arquivo.csv --dry-run`.
Pontos só aparecem na API quando `VERIFIED`; os de demonstração (`isDemo`) ficam ocultos, a menos que `INCLUDE_DEMO=true`.

## Roadmap
1. Banco, API e importador (esta entrega)
2. Frontend: mapa neon, clustering, filtros, busca, geolocalização
3. Rotas (OSRM), sugestões no site
4. Painel administrativo com autenticação
