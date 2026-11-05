# Pontos pesquisados (conferidos em 31/10/2026)

## Óleo de cozinha — `backend/data/oleo-papa-entulho.csv` (28 pontos, status VERIFIED)
Fonte: lista oficial de Papa-Entulhos do SLU-DF (https://www.slu.df.gov.br/papa-entulho), conferida em 31/10/2026, com horário de segunda a sábado, das 7h às 18h. A Caesb (Projeto Biguá) confirma parte deles como pontos de óleo: https://www.caesb.df.gov.br/coleta-de-oleo-de-fritura-residual/

Observações:
- Os Papa-Entulhos também recebem entulho, podas e recicláveis; aqui aparecem apenas como pontos de óleo.
- Na lista da Caesb, Santa Maria aparece com outro endereço (Fazenda Saia Velha AC 219), que não consta na lista atual do SLU; usei a do SLU.
- A página do SLU tem links "Google Maps" e "Waze" por unidade, que dão a localização exata: use-os para conferir/corrigir coordenadas.

## Pilhas e baterias — `backend/data/pilhas-green-eletron-a-confirmar.csv` (9 pontos, status PENDING)
Fonte: blog da Green Eletron de 15/02/2021. É uma lista antiga: **não publique antes de confirmar** que cada coletor ainda existe.
O localizador atual da Green Eletron (116 pontos de pilhas e baterias em Brasília) é dinâmico e não consegui extraí-lo: https://sistema.gmclog.com.br/info/green
Outras fontes a consultar: mapa da Sema-DF (Pontos de Coleta), programa Abinee, redes de supermercados e shoppings.

## Coordenadas
Os CSVs vêm SEM latitude/longitude de propósito: não inventei coordenadas. Use `npm run geocode:csv` e confira cada link no mapa.
