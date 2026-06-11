# PokeTeamGuess — Frontend (React)

Cliente do **PokeTeamGuess**: inventário, gacha, partidas bot/local (motor no browser) e amigo online (API + Socket.io).

## Desenvolvimento local

```bash
npm install
npm start
```

API em `http://localhost:8080` via proxy do CRA (`setupProxy.js`).

Opcional: copie `.env.example` → `.env.local` e ajuste `WDS_SOCKET_PATH` se o HMR conflitar com o backend.

## Deploy (Vercel)

### 1. Preparar `vercel.json`

Substitua `pokeguessteam-api.onrender.com` pela URL real do backend no Render (ex.: `https://meu-app.onrender.com`).

O proxy no mesmo domínio evita problemas com o cookie `JSESSIONID`.

### 2. Variáveis no Vercel

| Variável | Valor |
|----------|-------|
| `REACT_APP_API_URL` | *(vazio)* |
| `REACT_APP_SOCKET_URL` | *(vazio)* |
| `REACT_APP_API_WAKE_URL` | `https://SEU-APP.onrender.com` |
| `REACT_APP_API_COLD_START_AVERAGE_SECONDS` | `50` |
| `REACT_APP_ENABLE_API_HEALTH_CHECK` | `true` *(opcional em dev)* |

### 3. Importar repositório

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Framework: **Create React App**
3. Build: `npm run build` · Output: `build`
4. Deploy

### 4. CORS no backend

No Render, defina:

```text
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://seu-app.vercel.app
```

## Página “API a acordar”

Em **produção**, se o backend Render estiver suspenso (plano free), o utilizador vê uma página explicando:

- tempo médio de espera (~50s);
- que é um projeto académico com hospedagem gratuita;
- retry automático até a API responder (`GET /api/meta`).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Dev server `:3000` |
| `npm run build` | Build de produção |
| `npm test` | Testes |
