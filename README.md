# PokeTeamGuess — Frontend (React)

Cliente web do **PokeTeamGuess**: inventário, gacha, partidas bot/local (motor no browser) e amigo online (estado no servidor, sincronização manual via REST).

Repositório backend (Spring Boot): projeto `pokeguessteam` no IntelliJ / mesma org GitHub.

---

## Desenvolvimento local

```bash
npm install
npm start
```

- App: `http://localhost:3000`
- API: `http://localhost:8080` (proxy em `src/setupProxy.js`)
- Cookie `JSESSIONID` first-party em dev (não defina `REACT_APP_API_URL` localmente)

---

## Arquitetura

### Fluxo de arranque

```
index.tsx
 └─ Redux Provider
     └─ ThemeProvider → PreferencesProvider
         └─ AppRouter
             └─ ApiAvailabilityGate → AuthProvider → Routes
```

### Camadas (`src/`)

| Pasta | Responsabilidade |
|-------|------------------|
| **`pages/`** | Uma pasta por rota/feature. Contém a página, views por fase, providers e (opcionalmente) slice Redux. |
| **`components/`** | UI global (sprites, grids). Tabuleiro de partida → `pages/game/shared/components/`. |
| **`ds/`** | Design system: tokens CSS + primitivos (`Button`, `Card`, `PageShell`, …). |
| **`services/`** | **Camada HTTP canónica** — `gameService.ts`, `profileService.ts`, DTOs em `services/types/`. |
| **`api/`** | Re-export legado de `services/` — preferir `services/` em código novo. |
| **`store/`** | Redux global: `auth`, `cache`, reducers de features registados em `state.ts`. |
| **`lib/`** | Utilitários globais. Motor de partida → `pages/game/shared/lib/` (`lib/game/` = re-exports legados). |
| **`model/`** | Tipos de domínio + mapeadores DTO → modelo. |
| **`auth/`** | HTTP de autenticação, erros, helpers de display. Estado em `store/`. |
| **`hooks/`** | Hooks partilhados entre várias features. |
| **`routes/`** | `AppRouter` + guards (`ProtectedRoute`). |
| **`layouts/`** | Layout autenticado (`AuthenticatedLayout`). |

### Árvore por domínio

```
src/
├── pages/
│   ├── auth/           login, register, reset password, verify email
│   ├── home/           dashboard, equipa de treino, lançamento de jogos
│   ├── config/         perfil, aparência
│   ├── inventory/      PC, Pokédex, área selvagem (gacha)
│   ├── cold-start/     página “API a acordar” (Render free tier)
│   └── game/           ver também pages/game/README.md
│       ├── shared/
│       │   ├── components/  MatchBoard, TeamPicker, modais
│       │   ├── layout/      MatchSetupLayout
│       │   ├── lib/         motor de regras, labels, IA bot
│       │   └── slice/       matchDex Redux
│       ├── bot-match/       BotMatchBoard + slice + providers
│       ├── local-match/     LocalMatchBoard + slice
│       ├── friend-match/    FriendMatchBoard + timer + REST
│       └── historico/
└── store/
    ├── slices/auth, cache
    └── state.ts        regista reducers de pages/*
```

### Onde mexer (guia rápido)

| Quero alterar… | Ficheiro / pasta |
|----------------|------------------|
| Nova rota | `routes/AppRouter.tsx` + `pages/<feature>/` |
| Chamada HTTP | `services/<domínio>Service.ts` |
| Sessão / login | `store/slices/authSlice.ts`, `store/providers/AuthProvider.tsx`, `auth/authService.ts` |
| Cache do PC/Pokédex | `store/slices/cache/` |
| Tabuleiro / palpite UI | `pages/game/shared/components/MatchBoard.tsx` |
| Motor de regras (bot/local) | `pages/game/shared/lib/matchEngine.ts` |
| Partida vs bot | `pages/game/bot-match/` |
| Partida local | `pages/game/local-match/` |
| Partida amigo | `pages/game/friend-match/providers/FriendMatchProvider.tsx` |
| Timer 50s / skip | `pages/game/friend-match/hooks/useFriendTurnTimer.ts`, `friend-match/lib/friendMatchTiming.ts` |
| Dex carregado nas partidas | `pages/game/shared/slice/matchDexSlice.ts` |
| Tokens / botões | `ds/` |
| Feature flags | `lib/config/featureFlags.ts` |

### Modos de jogo

| Modo | Estado | Motor | Sincronização |
|------|--------|-------|---------------|
| **Bot** | Redux `botMatch` + `sessionStorage` | Cliente (`pages/game/shared/lib/`) | `PUT /team` + `POST /finish` |
| **Local** | Redux `localMatch` + `sessionStorage` | Cliente | `PUT /setup` + `POST /finish` |
| **Amigo** | `FriendMatchProvider` (React) | Servidor | REST manual (“Atualizar partida”); timer no cliente; `POST /skip` se tempo esgotar |

**Dex partilhado:** `matchDex` no Redux (`pages/game/shared/slice/`) alimenta a pesquisa de Pokémon em bot e amigo. Cada modo tem o seu provider de dex (`BotMatchDexProvider`, `FriendMatchDexProvider`).

### Redux

```ts
// store/state.ts
auth      // sessão, diálogo de intro
cache     // inventário persistido (localStorage)
matchDex  // mapa dex + pool para pesquisa nas partidas
botMatch  // partida bot (fase, equipa, clientState)
localMatch
homeUi
```

Slices de features vivem em `pages/*/slice/` mas são **registados** em `store/state.ts`.

### Convenções

- **Imports:** `tsconfig.json` tem `"baseUrl": "src"` — podes usar `import x from 'pages/game/...'` em código novo (migração gradual).
- **CSS:** módulos `.module.css` por componente; tokens em `ds/tokens.css`.
- **Providers:** contexto React por feature em `pages/<feature>/providers/`.
- **`*MatchBoard`:** cada modo tem o seu wrapper em `<modo>/components/` (liga `MatchBoard` ao provider de dex/play).

---

## Deploy (Vercel)

### `vercel.json`

Substitua o host do backend pela URL real do Render.

### Variáveis

| Variável | Valor |
|----------|-------|
| `REACT_APP_API_URL` | *(vazio — proxy no mesmo domínio)* |
| `REACT_APP_API_WAKE_URL` | `https://SEU-APP.onrender.com` |
| `REACT_APP_API_COLD_START_AVERAGE_SECONDS` | `50` |
| `REACT_APP_ENABLE_API_HEALTH_CHECK` | `true` |

### CORS no backend

```text
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://seu-app.vercel.app
```

### Página “API a acordar”

Em produção, se o Render estiver suspenso, `ApiAvailabilityGate` mostra `pages/cold-start/ApiColdStartPage` até `GET /api/meta` responder.

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Dev server `:3000` |
| `npm run build` | Build de produção |
| `npm test` | Testes |

---

## Referência API

Ver README do backend. Partida amigo: `POST /api/game/friend/match/skip` quando o timer do cliente expira (palpite aleatório no servidor).
