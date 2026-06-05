import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { finishLocalMatch, validateLocalSetup } from '../../api/gameApi';
import type { BotMatchGuessFeedbackDto, LocalMatchStateDto, MatchPlayerSide } from '../../api/types/game';
import { ApiError } from '../../api/http';
import { useAuth } from '../../auth/AuthContext';
import { accountDisplayName } from '../../auth/accountDisplay';
import { MatchBoard } from '../../components/game/MatchBoard';
import { MatchResultModal } from '../../components/game/MatchResultModal';
import { TeamPicker } from '../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../components/game/TeamSetupScreen';
import { gameResultLabel } from '../../lib/gameLabels';
import { guessedDexNumbersForSide } from '../../lib/matchGuesses';
import { resolvePokemonForMatch } from '../../lib/matchPokemonResolve';
import { useMatchFinishRedirect } from '../../hooks/useMatchFinishRedirect';
import {
  resolveLocalUserResult,
  resolveUserResult,
  type ClientMatchState,
} from '../../lib/clientMatchTypes';
import { loadMatchPokemonDex, toLocalMatchView } from '../../lib/clientMatchView';
import { LOCAL_OPPONENT_NAME_MIN } from '../../lib/gameConstants';
import {
  applyGuess,
  applySurrender,
  createClientMatch,
  isGuessAlreadyUsed,
} from '../../lib/matchEngine';
import { Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import hubStyles from './jogo.module.css';

type SetupPhase = 'idle' | 'host-team' | 'guest-team' | 'playing';

function appendLog(prev: BotMatchGuessFeedbackDto[], added: BotMatchGuessFeedbackDto[]) {
  const ids = new Set(prev.map((g) => g.id));
  const next = [...prev];
  for (const g of added) {
    if (!ids.has(g.id)) next.push(g);
  }
  return next;
}

export default function LocalMatchPage() {
  const { me } = useAuth();
  const hostName = accountDisplayName(me);

  const [phase, setPhase] = useState<SetupPhase>('idle');
  const [opponentName, setOpponentName] = useState('Ash');
  const [player1Team, setPlayer1Team] = useState<number[]>([]);
  const [player2Team, setPlayer2Team] = useState<number[]>([]);
  const [clientState, setClientState] = useState<ClientMatchState | null>(null);
  const [matchView, setMatchView] = useState<LocalMatchStateDto | null>(null);
  const [guessLog, setGuessLog] = useState<BotMatchGuessFeedbackDto[]>([]);
  const [pokemonDex, setPokemonDex] = useState<Awaited<ReturnType<typeof loadMatchPokemonDex>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadMatchPokemonDex().then(setPokemonDex).catch(() => {
      setError('Não foi possível carregar os Pokémon.');
    });
  }, []);

  const viewerSide: MatchPlayerSide = clientState?.currentTurn ?? 'HOST';

  const syncView = useCallback(
    (
      state: ClientMatchState,
      side: MatchPlayerSide,
      historyEntry: LocalMatchStateDto['historyEntry'] = null,
    ) => {
      if (!pokemonDex) return;
      setMatchView(toLocalMatchView(state, pokemonDex, side, historyEntry));
    },
    [pokemonDex],
  );

  useEffect(() => {
    if (!clientState || !pokemonDex || phase !== 'playing') return;
    syncView(clientState, viewerSide);
  }, [clientState, viewerSide, phase, pokemonDex, syncView]);

  const finishOnServer = useCallback(
    async (state: ClientMatchState, surrenderSide: MatchPlayerSide | null) => {
      const result =
        surrenderSide != null
          ? resolveLocalUserResult(state, surrenderSide)
          : resolveUserResult(state, false);
      const response = await finishLocalMatch({
        opponentName: state.localOpponentName ?? opponentName.trim(),
        userCorrectGuesses: state.hostHits.length,
        opponentCorrectGuesses: state.opponentHits.length,
        result,
      });
      setClientState(state);
      syncView(state, viewerSide, response.historyEntry);
    },
    [opponentName, syncView, viewerSide],
  );

  const startSetup = () => {
    const name = opponentName.trim();
    if (name.length < LOCAL_OPPONENT_NAME_MIN) {
      setError(`Nome do jogador 2: mínimo ${LOCAL_OPPONENT_NAME_MIN} caracteres.`);
      return;
    }
    setError(null);
    setPhase('host-team');
  };

  const confirmGuestTeam = async () => {
    const name = opponentName.trim();
    if (name.length < LOCAL_OPPONENT_NAME_MIN) {
      setError(`Nome do jogador 2: mínimo ${LOCAL_OPPONENT_NAME_MIN} caracteres.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await validateLocalSetup({
        opponentName: name,
        hostTeam: player1Team,
        opponentTeam: player2Team,
      });
      const state = createClientMatch(player1Team, player2Team, {
        localOpponentName: name,
        hostDisplayName: hostName,
      });
      setClientState(state);
      setGuessLog([]);
      syncView(state, state.currentTurn);
      setPhase('playing');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Equipas inválidas.');
    } finally {
      setBusy(false);
    }
  };

  const guess = async (dex: number) => {
    if (!clientState || !pokemonDex) return;
    if (clientState.status !== 'ACTIVE') return;
    if (isGuessAlreadyUsed(clientState, viewerSide, dex)) return;

    setBusy(true);
    setError(null);
    try {
      const pokemon = await resolvePokemonForMatch(dex, pokemonDex, setPokemonDex);
      const { feedback, state } = applyGuess(clientState, viewerSide, pokemon);
      setClientState(state);
      syncView(state, state.currentTurn);
      setGuessLog((prev) => appendLog(prev, [feedback]));

      if (state.status === 'FINISHED') {
        await finishOnServer(state, null);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Palpite inválido.');
    } finally {
      setBusy(false);
    }
  };

  const surrender = async () => {
    if (!clientState) return;
    setBusy(true);
    setError(null);
    try {
      const state = applySurrender(clientState, viewerSide);
      setClientState(state);
      await finishOnServer(state, viewerSide);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao terminar a partida.');
    } finally {
      setBusy(false);
    }
  };

  const excludedGuesses = useMemo(
    () => guessedDexNumbersForSide(guessLog, viewerSide),
    [guessLog, viewerSide],
  );

  const matchEnded = clientState?.status === 'FINISHED';
  const resultReady = Boolean(matchView?.historyEntry);
  const showResultModal = matchEnded && resultReady;
  const pendingServerFinish = matchEnded && !resultReady;
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(showResultModal);

  if (phase === 'idle') {
    return (
      <PageShell width="wide">
        <Card padding="md">
          <Link to="/">← Início</Link>
          <h1 className="ds-h1">Duelo local</h1>
          <p className="ds-body-muted">Dois jogadores no mesmo ecrã — regras no cliente.</p>
          {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
          <div style={{ maxWidth: '20rem', marginTop: 'var(--ds-space-6)' }}>
            <TextField
              label="Nome do jogador 2"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            style={{ marginTop: 'var(--ds-space-4)' }}
            disabled={busy}
            onClick={startSetup}
          >
            Iniciar partida local
          </Button>
        </Card>
      </PageShell>
    );
  }

  if (phase === 'host-team') {
    return (
      <TeamSetupScreen error={error}>
        <TeamPicker
          value={player1Team}
          onChange={setPlayer1Team}
          onSubmit={() => setPhase('guest-team')}
          onBack={() => setPhase('idle')}
          loading={busy}
        />
      </TeamSetupScreen>
    );
  }

  if (phase === 'guest-team') {
    return (
      <TeamSetupScreen error={error}>
        <p className="ds-body-muted" style={{ marginBottom: 'var(--ds-space-4)' }}>
          Equipa de <strong>{opponentName.trim()}</strong>
        </p>
        <TeamPicker
          value={player2Team}
          onChange={setPlayer2Team}
          onSubmit={() => void confirmGuestTeam()}
          onBack={() => setPhase('host-team')}
          loading={busy}
        />
      </TeamSetupScreen>
    );
  }

  if (!matchView || !clientState) {
    return (
      <div className={hubStyles.matchScreen}>
        <p className="ds-body-muted">A preparar partida…</p>
      </div>
    );
  }

  const isGuestView = viewerSide === 'OPPONENT';
  const activePlayerName =
    viewerSide === 'HOST' ? matchView.hostDisplayName : matchView.localOpponentName;
  const opponentNameForBoard =
    viewerSide === 'HOST' ? matchView.localOpponentName : matchView.hostDisplayName;
  const myTeam = viewerSide === 'HOST' ? matchView.hostTeam : matchView.opponentTeam;
  const opponentHitsOnMyTeam =
    viewerSide === 'HOST' ? matchView.opponentHits : matchView.hostHits;

  const finishedLines = matchView.historyEntry
    ? matchView.historyEntry.players.map(
        (p) => `${p.username ?? 'Jogador'}: ${gameResultLabel(p.result)} (${p.correctGuesses}/6)`,
      )
    : ['Partida terminada.'];

  const awaitingFinalResponse =
    clientState.status === 'ACTIVE' &&
    clientState.finalResponseFor != null &&
    clientState.currentTurn === clientState.finalResponseFor;

  return (
    <div
      className={[hubStyles.matchScreen, isGuestView ? hubStyles.matchScreenGuest : '']
        .filter(Boolean)
        .join(' ')}
    >
      <MatchResultModal
        open={showResultModal}
        lines={finishedLines}
        secondsLeft={secondsLeft}
        onGoHome={goHomeNow}
      />

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {awaitingFinalResponse ? (
        <p className="ds-body-muted" role="status">
          Rodada extra — {activePlayerName} tenta o empate.
        </p>
      ) : null}

      {pendingServerFinish ? (
        <p className="ds-body-muted">A guardar resultado…</p>
      ) : null}

      {!matchEnded || pendingServerFinish ? (
        <div className={hubStyles.matchBoardWrap}>
          <MatchBoard
            playerName={activePlayerName ?? 'Jogador'}
            opponentName={opponentNameForBoard ?? 'Adversário'}
            userScore={
              viewerSide === 'HOST' ? matchView.hostCorrectGuesses : matchView.opponentCorrectGuesses
            }
            opponentScore={
              viewerSide === 'HOST' ? matchView.opponentCorrectGuesses : matchView.hostCorrectGuesses
            }
            isYourTurn={clientState.status === 'ACTIVE' && !busy && !pendingServerFinish}
            status={matchEnded ? 'FINISHED' : 'ACTIVE'}
            opponentKnowledge={matchView.opponentKnowledge}
            myTeam={myTeam}
            opponentHitsOnMyTeam={opponentHitsOnMyTeam}
            onGuess={guess}
            onSurrender={() => void surrender()}
            busy={busy || pendingServerFinish}
            excludedPokedexNumbers={excludedGuesses}
            playerTheme={isGuestView ? 'guest' : 'default'}
          />
        </div>
      ) : null}
    </div>
  );
}
