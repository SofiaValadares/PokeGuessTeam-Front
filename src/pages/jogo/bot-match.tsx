import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RIVAL } from '../../lib/gameCharacters';
import { finishBotMatch, validateBotTeam } from '../../api/gameApi';
import type { BotMatchGuessFeedbackDto, BotMatchStateDto } from '../../api/types/game';
import type { PokemonDto } from '../../api/types/pokemon';
import { ApiError } from '../../api/http';
import { useAuth } from '../../auth/AuthContext';
import { accountDisplayName } from '../../auth/accountDisplay';
import { MatchBoard } from '../../components/game/MatchBoard';
import { BotGuessOverlay } from '../../components/game/BotGuessOverlay';
import { MatchResultModal } from '../../components/game/MatchResultModal';
import { TeamPicker } from '../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../components/game/TeamSetupScreen';
import { useMatchFinishRedirect } from '../../hooks/useMatchFinishRedirect';
import { guessedDexNumbersForSide } from '../../lib/matchGuesses';
import { gameResultLabel } from '../../lib/gameLabels';
import { chooseBotGuess } from '../../lib/botAi';
import {
  resolveUserResult,
  type ClientMatchState,
} from '../../lib/clientMatchTypes';
import { loadMatchPokemonDex, toBotMatchView } from '../../lib/clientMatchView';
import { resolvePokemonForMatch } from '../../lib/matchPokemonResolve';
import { BOT_GUESS_DELAY_MS } from '../../lib/gameConstants';
import {
  applyGuess,
  applySurrender,
  createClientMatch,
  isGuessAlreadyUsed,
} from '../../lib/matchEngine';
import { InlineAlert } from '../../ds';
import hubStyles from './jogo.module.css';

const BOT_TURN_DISPLAY_MS = BOT_GUESS_DELAY_MS;

function appendLog(prev: BotMatchGuessFeedbackDto[], added: BotMatchGuessFeedbackDto[]) {
  const ids = new Set(prev.map((g) => g.id));
  const next = [...prev];
  for (const g of added) {
    if (!ids.has(g.id)) next.push(g);
  }
  return next;
}

export default function BotMatchPage() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const hostName = accountDisplayName(me);
  const [phase, setPhase] = useState<'setup' | 'playing'>('setup');
  const [team, setTeam] = useState<number[]>([]);
  const [clientState, setClientState] = useState<ClientMatchState | null>(null);
  const [matchView, setMatchView] = useState<BotMatchStateDto | null>(null);
  const [guessLog, setGuessLog] = useState<BotMatchGuessFeedbackDto[]>([]);
  const [pokemonDex, setPokemonDex] = useState<Awaited<ReturnType<typeof loadMatchPokemonDex>> | null>(null);
  const [allPokemon, setAllPokemon] = useState<PokemonDto[]>([]);
  const [loadingDex, setLoadingDex] = useState(true);
  const [busy, setBusy] = useState(false);
  const [botBusy, setBotBusy] = useState(false);
  const [activeBotGuess, setActiveBotGuess] = useState<BotMatchGuessFeedbackDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const botRunningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadMatchPokemonDex()
      .then((dex) => {
        if (cancelled) return;
        setPokemonDex(dex);
        setAllPokemon(Array.from(dex.values()));
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os Pokémon.');
      })
      .finally(() => {
        if (!cancelled) setLoadingDex(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const syncView = useCallback(
    (state: ClientMatchState, historyEntry: BotMatchStateDto['historyEntry'] = null) => {
      if (!pokemonDex) return;
      setMatchView(toBotMatchView(state, pokemonDex, historyEntry));
    },
    [pokemonDex],
  );

  const finishOnServer = useCallback(
    async (state: ClientMatchState, surrendered: boolean) => {
      const result = resolveUserResult(state, surrendered);
      const response = await finishBotMatch({
        userCorrectGuesses: state.hostHits.length,
        opponentCorrectGuesses: state.opponentHits.length,
        result,
      });
      setClientState(state);
      syncView(state, response.historyEntry);
    },
    [syncView],
  );

  const pickBotGuess = useCallback(
    (state: ClientMatchState) => {
      const pool = allPokemon.length > 0 ? allPokemon : Array.from(pokemonDex?.values() ?? []);
      const chosen = chooseBotGuess(pool, state, 'OPPONENT', pokemonDex!);
      if (chosen) return chosen;
      const used = new Set(
        state.guesses
          .filter((g) => g.playerSide === 'OPPONENT')
          .map((g) => g.guessedPokedexNumber),
      );
      const remaining = pool.filter((p) => !used.has(p.number));
      if (remaining.length === 0) return null;
      return remaining[Math.floor(Math.random() * remaining.length)] ?? null;
    },
    [allPokemon, pokemonDex],
  );

  const runBotTurns = useCallback(
    async (initial: ClientMatchState) => {
      if (!pokemonDex || botRunningRef.current) return;
      botRunningRef.current = true;
      setBotBusy(true);

      let state = initial;
      try {
        while (state.status === 'ACTIVE' && state.currentTurn === 'OPPONENT') {
          const botGuess = pickBotGuess(state);
          if (!botGuess) break;

          const { feedback, state: next } = applyGuess(state, 'OPPONENT', botGuess);
          state = next;
          setClientState(next);
          syncView(next);
          setGuessLog((prev) => appendLog(prev, [feedback]));
          setActiveBotGuess(feedback);

          await new Promise((resolve) => window.setTimeout(resolve, BOT_TURN_DISPLAY_MS));
          setActiveBotGuess(null);

          if (next.status === 'FINISHED') {
            await finishOnServer(next, false);
            break;
          }
          if (next.currentTurn !== 'OPPONENT') break;
        }
      } finally {
        botRunningRef.current = false;
        setBotBusy(false);
      }
    },
    [finishOnServer, pickBotGuess, pokemonDex, syncView],
  );

  useEffect(() => {
    if (
      phase !== 'playing' ||
      !clientState ||
      clientState.status !== 'ACTIVE' ||
      clientState.currentTurn !== 'OPPONENT' ||
      botRunningRef.current ||
      !pokemonDex
    ) {
      return;
    }
    void runBotTurns(clientState);
  }, [phase, clientState, pokemonDex, runBotTurns]);

  const sendTeam = async () => {
    setBusy(true);
    setError(null);
    try {
      const setup = await validateBotTeam(team);
      const state = createClientMatch(setup.hostTeam, setup.opponentTeam, {
        hostDisplayName: hostName,
      });
      setClientState(state);
      setGuessLog([]);
      syncView(state);
      setPhase('playing');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Equipe inválida.');
    } finally {
      setBusy(false);
    }
  };

  const guess = async (dex: number) => {
    if (!clientState || !pokemonDex || botBusy || clientState.currentTurn !== 'HOST') return;
    if (isGuessAlreadyUsed(clientState, 'HOST', dex)) return;

    setBusy(true);
    setError(null);
    try {
      const pokemon = await resolvePokemonForMatch(dex, pokemonDex, setPokemonDex);
      const { feedback, state } = applyGuess(clientState, 'HOST', pokemon);
      setClientState(state);
      syncView(state);
      setGuessLog((prev) => appendLog(prev, [feedback]));

      if (state.status === 'FINISHED') {
        await finishOnServer(state, false);
        return;
      }

      if (state.currentTurn === 'OPPONENT') {
        void runBotTurns(state);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Palpite inválido.');
    } finally {
      setBusy(false);
    }
  };

  const surrender = async () => {
    if (!clientState) return;
    setBusy(true);
    try {
      const state = applySurrender(clientState, 'HOST');
      setClientState(state);
      await finishOnServer(state, true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao desistir.');
    } finally {
      setBusy(false);
    }
  };

  const matchEnded = clientState?.status === 'FINISHED';
  const resultReady = Boolean(matchView?.historyEntry);
  const showResultModal = matchEnded && resultReady;
  const pendingServerFinish = matchEnded && !resultReady;
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(showResultModal);

  const awaitingBotFinalResponse =
    clientState?.status === 'ACTIVE' &&
    clientState.finalResponseFor === 'OPPONENT' &&
    clientState.lastCompletingPlayer === 'HOST';

  const botTurnActive = activeBotGuess !== null || botBusy;

  const yourTurn =
    clientState?.status === 'ACTIVE' &&
    clientState.currentTurn === 'HOST' &&
    !matchEnded &&
    !botTurnActive;

  const excludedGuesses = useMemo(
    () => guessedDexNumbersForSide(guessLog, 'HOST'),
    [guessLog],
  );

  const finishedLines = matchView?.historyEntry
    ? matchView.historyEntry.players
        .map((p) => `${p.username ?? 'Jogador'}: ${gameResultLabel(p.result)} (${p.correctGuesses}/6)`)
    : ['Partida terminada.'];

  if (phase === 'setup') {
    return (
      <TeamSetupScreen error={error}>
        {loadingDex ? (
          <p className="ds-body-muted">A carregar Pokédex…</p>
        ) : (
          <TeamPicker
            value={team}
            onChange={setTeam}
            minRegistered={12}
            onSubmit={() => void sendTeam()}
            onBack={() => navigate('/')}
            loading={busy}
          />
        )}
      </TeamSetupScreen>
    );
  }

  if (!matchView) {
    return (
      <div className={hubStyles.matchScreen}>
        <p className="ds-body-muted">A preparar duelo…</p>
      </div>
    );
  }

  return (
    <div
      className={[
        hubStyles.matchScreen,
        botTurnActive ? hubStyles.matchScreenWaiting : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {activeBotGuess ? (
        <BotGuessOverlay
          key={activeBotGuess.id}
          guess={activeBotGuess}
          opponentName={RIVAL.shortName}
        />
      ) : null}

      <MatchResultModal
        open={showResultModal}
        lines={finishedLines}
        secondsLeft={secondsLeft}
        onGoHome={goHomeNow}
      />

      {error ? (
        <InlineAlert tone="error" role="alert">
          {error}
        </InlineAlert>
      ) : null}

      {awaitingBotFinalResponse && !botTurnActive ? (
        <p className="ds-body-muted" role="status">
          Descobriste os 6 — {RIVAL.shortName} tem uma rodada extra para tentar o empate.
        </p>
      ) : null}

      {botBusy && !activeBotGuess ? (
        <p className="ds-body-muted">{RIVAL.shortName} está pensando…</p>
      ) : null}

      {pendingServerFinish ? (
        <p className="ds-body-muted">A guardar resultado…</p>
      ) : null}

      {!matchEnded || pendingServerFinish ? (
        <div className={hubStyles.matchBoardWrap}>
          <MatchBoard
            playerName={hostName}
            opponentName={RIVAL.shortName}
            userScore={matchView.hostCorrectGuesses}
            opponentScore={matchView.opponentCorrectGuesses}
            isYourTurn={yourTurn}
            status={matchEnded ? 'FINISHED' : 'ACTIVE'}
            opponentKnowledge={matchView.opponentKnowledge}
            myTeam={matchView.hostTeam}
            opponentHitsOnMyTeam={matchView.opponentHits ?? []}
            onGuess={guess}
            onSurrender={() => void surrender()}
            busy={busy || botTurnActive || pendingServerFinish}
            excludedPokedexNumbers={excludedGuesses}
            playerTheme={botTurnActive ? 'waiting' : 'default'}
          />
        </div>
      ) : null}
    </div>
  );
}
