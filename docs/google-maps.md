# Como configurar o Google Maps (EcoMapa DF)

O mapa do site usa a **Maps JavaScript API** do Google. Ela precisa de uma chave de API e de uma conta de cobrança ativa no Google Cloud.
O Google oferece **10.000 carregamentos de mapa grátis por mês**; acima disso cobra por uso (consulte a tabela de preços no Google Cloud). Para um site pequeno costuma ficar no grátis, mas configure alertas (passo 7).

## 1. Criar o projeto

1. Acesse https://console.cloud.google.com e entre com sua conta Google.
2. No topo, clique no seletor de projeto > **Novo projeto** > nome `EcoMapa DF` > **Criar**.

## 2. Ativar a cobrança

1. Menu **Faturamento** (Billing) > **Vincular uma conta de faturamento** (ou criar uma).
2. O Google pede um cartão para validar a conta. Dentro do limite grátis não há cobrança.

## 3. Ativar a API

1. Menu **APIs e serviços** > **Biblioteca**.
2. Pesquise **Maps JavaScript API** > **Ativar**.

## 4. Criar a chave

1. **APIs e serviços** > **Credenciais** > **Criar credenciais** > **Chave de API**.
2. Clique na chave criada para editar e configure as restrições (importante: a chave fica visível no navegador, só as restrições a protegem):
   - **Restrições de aplicativo** > **Sites (referenciadores HTTP)** e adicione:
     - `http://localhost:3000/*`
     - `http://localhost:3001/*`
     - o endereço do site quando publicar, por exemplo `https://seusite.com.br/*`
   - **Restrições de API** > **Restringir chave** > marque apenas **Maps JavaScript API**.
3. Salve (pode levar alguns minutos para valer).

## 5. Colocar a chave no projeto

No arquivo `frontend/.env.local` (crie se não existir):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCRFBQDrwtEYpKkXN4QX6_L0FO8fIcCRuM
```

Reinicie o frontend (`Ctrl+C` e `npm run dev`).

## 6. Map ID com estilo escuro (recomendado)

Os marcadores neon usam "marcadores avançados", que exigem um Map ID. Sem configurar nada o site usa o `DEMO_MAP_ID` do Google, que é só para testes.

1. **Google Maps Platform** > **Gerenciamento de mapas** > **Criar ID do mapa**.
2. Nome `EcoMapa`, tipo **JavaScript**, **Vetor**. Salve.
3. **Estilos de mapa** > **Criar estilo**, escolha um tema escuro, publique e associe ao Map ID.
4. Coloque o ID no `.env.local`:

```
NEXT_PUBLIC_GOOGLE_MAP_ID=seu-map-id
```

## 7. Evitar surpresas de cobrança

- **Faturamento** > **Orçamentos e alertas** > crie um orçamento (ex.: R$ 50) com alertas de 50%, 90% e 100%.
- **APIs e serviços** > **Maps JavaScript API** > **Cotas** > defina um limite diário de carregamentos de mapa.

## Problemas comuns

- _Mapa mostra "O Google recusou a chave"_: cobrança não ativada, API não habilitada, ou o endereço do site não está nas restrições da chave.
- _Mapa cinza com "For development purposes only"_: cobrança não ativada no projeto.
- _Mapa claro em vez de escuro_: configure o Map ID com estilo escuro (passo 6).
