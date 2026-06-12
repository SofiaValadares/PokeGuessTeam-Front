# Partidas (`pages/game/`)

Tudo relacionado com modos de jogo vive aqui, organizado por feature.

## Estrutura

```
game/
├── shared/                    # Código partilhado entre modos
│   ├── components/            # Tabuleiro, picker, modais (MatchBoard, TeamPicker, …)
│   ├── layout/                # MatchSetupLayout + CSS de página de setup
│   ├── lib/                   # Motor de regras, labels, IA do bot, parse amigo
│   └── slice/                 # Redux matchDex (pesquisa de Pokémon nas partidas)
├── bot-match/                 # vs CPU — slice Redux + providers + BotMatchBoard
├── local-match/               # pass-and-play — slice + LocalMatchBoard
├── friend-match/              # online — Socket.io em tempo real (sala de espera + jogo)
└── historico/                 # listagem de partidas
```

## Onde colocar código novo

| Tipo | Pasta |
|------|--------|
| UI só de um modo | `<modo>/components/` |
| Wrapper do tabuleiro para um modo | `<modo>/components/*MatchBoard.tsx` |
| UI igual em bot/local/amigo | `shared/components/` |
| Regra de jogo / motor | `shared/lib/` |
| Estado Redux do modo | `<modo>/slice/` |
| Contexto React do modo | `<modo>/providers/` |

## Imports

Preferir caminhos relativos dentro de `pages/game/` (ex.: `../../shared/components/MatchBoard`).

`lib/game/*` na raiz de `src/` são re-exports legados — usar `pages/game/shared/lib/` em código novo.
