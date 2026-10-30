# Fontes de dados (a pesquisar e confirmar)

Regra do projeto: nenhum ponto entra sem **endereço confirmável, fonte e data**.
Coordenadas devem vir da fonte ou de geocodificação do endereço (Nominatim), conferida no mapa.

Candidatas a consultar (confirmar disponibilidade e termos de uso de cada uma):

- SLU-DF e Secretaria de Meio Ambiente do DF (pontos de entrega voluntária, programas de óleo de cozinha)
- Logística reversa: entidades gestoras de pilhas/baterias e programas de fabricantes
- Redes de varejo e assistências técnicas que recebem pilhas/baterias
- Cooperativas de catadores e projetos de coleta de óleo vegetal
- OpenStreetMap (tags de reciclagem), respeitando a licença ODbL

Fluxo: coletar -> preencher `backend/data/collection-points.template.csv` ->
`npm run import:csv -- data/arquivo.csv --dry-run` -> importar como `PENDING` -> verificar -> marcar `VERIFIED`.
Só pontos `VERIFIED` aparecem na API pública.
