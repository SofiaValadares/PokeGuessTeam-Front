import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  abandonFriendMatch,
  createFriendMatch,
  getFriendMatch,
  isMatchAlreadyInProgressError,
  joinFriendMatch,
  submitFriendGuess,
  submitFriendTeam,
  surrenderFriendMatch,
} from '../../api/gameApi';
import type {
  BotMatchGuessFeedbackDto,
  FriendMatchStateDto,
  MatchRealtimeMessage,
} from '../../api/types/game';
import { ApiError } from '../../api/http';
import { useAuth } from '../../auth/AuthContext';
import { accountDisplayName } from '../../auth/accountDisplay';
import { MatchBoard } from '../../components/game/MatchBoard';
import { MatchResultModal } from '../../components/game/MatchResultModal';
import { TeamPicker } from '../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../components/game/TeamSetupScreen';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { useMatchFinishRedirect } from '../../hooks/useMatchFinishRedirect';
import { normalizeFriendMatchState } from '../../lib/matchNormalize';
import { gameResultLabel } from '../../lib/gameLabels';
import { guessedDexNumbersForSide } from '../../lib/matchGuesses';
import { Button, InlineAlert, TextField } from '../../ds';
import gameStyles from '../../components/game/game.module.css';
import hubStyles from './jogo.module.css';

type FlowPhase = 'team' | 'lobby' | 'waiting' | 'playing';

function formatDeadline(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString(undefined, { minute: '2-digit', second: '2-digit' });
}

function resolvePhaseFromMatch(m: FriendMatchStateDto): FlowPhase {
  if (m.status === 'ACTIVE' || m.status === 'FINISHED') return 'playing';
  if (m.status === 'SETUP' && m.yourTeam.length === 6) return 'waiting';
  return 'team';
}

export default function FriendMatchPage() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const [searchParams] = useSearchParams();
  const prefilledCode = searchParams.get('code')?.trim().toUpperCase() ?? '';
  const initialLoadDone = useRef(false);

  const [phase, setPhase] = useState<FlowPhase>('team');
  const [match, setMatch] = useState<FriendMatchStateDto | null>(null);
  const [team, setTeam] = useState<number[]>([]);
  const [joinCode, setJoinCode] = useState(prefilledCode);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [turnDeadline, setTurnDeadline] = useState<string | null>(null);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyAction = useCallback((state: FriendMatchStateDto, _feedbacks: BotMatchGuessFeedbackDto[]) => {
    setMatch(state);
    if (state.turnDeadlineAt) setTurnDeadline(state.turnDeadlineAt);
    if (state.status === 'ACTIVE' || state.status === 'FINISHED') {
      setPhase('playing');
    } else if (state.status === 'SETUP' && state.yourTeam.length === 6) {
      setPhase('waiting');
    }
  }, []);

  const handleRealtime = useCallback((msg: MatchRealtimeMessage) => {
    if (msg.type === 'TURN_TIMER' && msg.turnDeadlineAt) {
      setTurnDeadline(msg.turnDeadlineAt);
      return;
    }
    if (msg.type === 'TIMEOUT_PENALTY') {
      setRealtimeNotice(
        msg.message ??
          `Penalidade por tempo (${msg.timeoutPenalties ?? '?'}/${msg.maxTimeoutPenalties ?? 3}).`,
      );
    }
    if (msg.type === 'OPPONENT_REPLACED_BY_BOT') {
      setRealtimeNotice(msg.message ?? 'O adversário foi substituído por IA.');
    }
    if (msg.friendMatch) {
      const state = normalizeFriendMatchState(msg.friendMatch);
      setMatch(state);
      if (state.turnDeadlineAt) setTurnDeadline(state.turnDeadlineAt);
      if (state.status === 'ACTIVE' || state.status === 'FINISHED') {
        setPhase('playing');
      }
    }
  }, []);

  useMatchRealtime({
    enabled: phase === 'waiting' || match?.status === 'ACTIVE',
    mode: 'friend',
    matchId: match?.matchId ?? null,
    userId: me?.userId ?? null,
    onMessage: handleRealtime,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getFriendMatch();
      setMatch(m);
      if (m.yourTeam?.length) setTeam(m.yourTeam);
      if (m.turnDeadlineAt) setTurnDeadline(m.turnDeadlineAt);
      setPhase(resolvePhaseFromMatch(m));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setMatch(null);
        if (!initialLoadDone.current) setPhase('team');
      } else {
        setError(e instanceof ApiError ? e.message : 'Erro ao carregar.');
      }
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (phase !== 'waiting' || match?.status !== 'SETUP') return;
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [phase, match?.status, load]);

  const abandonAndHome = async () => {
    setBusy(true);
    try {
      await abandonFriendMatch();
    } catch (e) {
      if (!(e instanceof ApiError && (e.status === 404 || e.status === 400))) {
        setError(e instanceof ApiError ? e.message : 'Erro ao cancelar.');
        return;
      }
    } finally {
      setBusy(false);
    }
    navigate('/');
  };

  const confirmTeam = () => {
    if (team.length !== 6) {
      setError('Seleciona 6 pokémon para a equipe.');
      return;
    }
    setError(null);
    if (prefilledCode) {
      void joinRoom(prefilledCode);
    } else {
      setPhase('lobby');
    }
  };

  const createRoom = async () => {
    if (team.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createFriendMatch();
      setMatch(created);
      const res = await submitFriendTeam(team);
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      if (isMatchAlreadyInProgressError(e)) {
        setError('Já tens uma partida em curso.');
        void load();
      } else {
        setError(e instanceof ApiError ? e.message : 'Não foi possível criar a sala.');
      }
    } finally {
      setBusy(false);
    }
  };

  const joinRoom = async (codeInput?: string) => {
    const code = (codeInput ?? joinCode).trim().toUpperCase();
    if (code.length !== 6) {
      setError('Código com 6 caracteres.');
      return;
    }
    if (team.length !== 6) {
      setError('Seleciona 6 pokémon antes de entrar.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const joined = await joinFriendMatch(code);
      setMatch(joined);
      const res = await submitFriendTeam(team);
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      if (isMatchAlreadyInProgressError(e)) {
        setError('Já tens uma partida em curso.');
        void load();
      } else {
        setError(e instanceof ApiError ? e.message : 'Código inválido ou sala cheia.');
      }
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!match?.joinCode) return;
    try {
      await navigator.clipboard.writeText(match.joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Não foi possível copiar o código.');
    }
  };

  const guess = async (dex: number) => {
    setBusy(true);
    try {
      const res = await submitFriendGuess(dex);
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Palpite inválido.');
    } finally {
      setBusy(false);
    }
  };

  const surrender = async () => {
    setBusy(true);
    try {
      const res = await surrenderFriendMatch();
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro.');
    } finally {
      setBusy(false);
    }
  };

  const opponentName =
    match?.host.userId === me?.userId
      ? match?.guest?.username ?? 'Convidado'
      : match?.host.username ?? 'Anfitrião';

  const excludedGuesses = useMemo(() => {
    if (!match) return [];
    const side = match.yourSide ?? 'HOST';
    return guessedDexNumbersForSide(match.recentGuesses ?? [], side);
  }, [match]);

  const finished = match?.status === 'FINISHED';
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(Boolean(finished && match?.historyEntry));
  const finishedLines = match?.historyEntry
    ? match.historyEntry.players.map(
        (p) => `${p.username ?? 'Jogador'}: ${gameResultLabel(p.result)} (${p.correctGuesses}/6)`,
      )
    : ['Partida terminada.'];
  const deadlineLabel = formatDeadline(turnDeadline);

  if (loading && !initialLoadDone.current) {
    return (
      <div className={hubStyles.matchScreen}>
        <p className="ds-body-muted">A carregar…</p>
      </div>
    );
  }

  if (phase === 'team') {
    return (
      <TeamSetupScreen error={error}>
        <TeamPicker
          value={team}
          onChange={setTeam}
          onSubmit={() => confirmTeam()}
          onBack={() => navigate('/')}
          loading={busy}
          submitLabel="CONTINUAR"
        />
      </TeamSetupScreen>
    );
  }

  if (phase === 'lobby') {
    return (
      <TeamSetupScreen error={error}>
        <div className={hubStyles.setupBlock}>
          <h2 className={hubStyles.setupTitle}>Sala de partida</h2>
          <p className={hubStyles.setupExtra}>
            Equipe pronta ({team.length}/6). Cria uma sala ou entra com um código.
          </p>

          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            disabled={busy}
            onClick={() => void createRoom()}
          >
            CRIAR SALA
          </Button>

          <div style={{ marginTop: 'var(--ds-space-6)' }}>
            <TextField
              label="Código da sala"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              disabled={busy || joinCode.trim().length !== 6}
              onClick={() => void joinRoom()}
              style={{ marginTop: 'var(--ds-space-3)' }}
            >
              ENTRAR
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={busy}
            onClick={() => {
              setError(null);
              setPhase('team');
            }}
            style={{ marginTop: 'var(--ds-space-6)' }}
          >
            VOLTAR À EQUIPE
          </Button>
        </div>
      </TeamSetupScreen>
    );
  }

  if (phase === 'waiting' && match) {
    const isHost = match.host.userId === me?.userId;
    return (
      <TeamSetupScreen error={error}>
        <div className={hubStyles.setupBlock}>
          <h2 className={hubStyles.setupTitle}>
            {isHost ? 'Sala criada — à espera do adversário' : 'Equipe enviada — à espera do anfitrião'}
          </h2>

          {realtimeNotice ? <p className={hubStyles.setupExtra}>{realtimeNotice}</p> : null}

          {match.joinCode ? (
            <div className={hubStyles.setupBlock}>
              <p className={hubStyles.setupExtra}>Código da partida</p>
              <p>
                <span className={gameStyles.lobbyCode}>{match.joinCode}</span>
              </p>
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void copyCode()}>
                {copied ? 'Copiado!' : 'COPIAR CÓDIGO'}
              </Button>
            </div>
          ) : null}

          <ul className={hubStyles.setupExtra} style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li>
              Anfitrião: {match.host.username} {match.host.teamReady ? '✓ equipe' : '…'}
            </li>
            <li>
              Convidado:{' '}
              {match.guest
                ? `${match.guest.username} ${match.guest.teamReady ? '✓ equipe' : '…'}`
                : 'à espera'}
            </li>
          </ul>

          <p className={hubStyles.setupExtra}>A partida inicia automaticamente quando ambos estiverem prontos.</p>

          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={busy}
            onClick={() => void abandonAndHome()}
            style={{ marginTop: 'var(--ds-space-6)' }}
          >
            CANCELAR E VOLTAR
          </Button>
        </div>
      </TeamSetupScreen>
    );
  }

  if (!match) {
    return (
      <div className={hubStyles.matchScreen}>
        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}
        <p className="ds-body-muted">Não foi possível carregar a partida.</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/')}>
          VOLTAR AO HUB
        </Button>
      </div>
    );
  }

  return (
    <div
      className={[
        hubStyles.matchScreen,
        !match.yourTurn && !finished ? hubStyles.matchScreenWaiting : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <MatchResultModal
        open={Boolean(finished && match.historyEntry)}
        lines={finishedLines}
        secondsLeft={secondsLeft}
        onGoHome={goHomeNow}
      />

      {error ? (
        <InlineAlert tone="error" role="alert">
          {error}
        </InlineAlert>
      ) : null}
      {realtimeNotice ? <p className="ds-body-muted">{realtimeNotice}</p> : null}

      {match.opponentReplacedByBot ? (
        <p className="ds-body-muted">O adversário foi substituído por IA após penalidades.</p>
      ) : null}
      {deadlineLabel && match.yourTurn && !finished ? (
        <p className="ds-body-muted">Prazo do turno: {deadlineLabel}</p>
      ) : null}
      {!match.yourTurn && !finished ? (
        <p className="ds-body-muted">Aguardando a jogada de {opponentName}…</p>
      ) : null}
      {match.yourTimeoutPenalties != null && match.yourTimeoutPenalties > 0 ? (
        <p className="ds-body-muted">As tuas penalidades por tempo: {match.yourTimeoutPenalties}/3</p>
      ) : null}

      {!finished ? (
        <div className={hubStyles.matchBoardWrap}>
          <MatchBoard
          playerName={me ? accountDisplayName(me) : 'Tu'}
          opponentName={opponentName}
          userScore={match.yourCorrectGuesses}
          opponentScore={match.opponentCorrectGuesses}
          isYourTurn={match.yourTurn}
          status="ACTIVE"
          opponentKnowledge={match.opponentKnowledge}
          myTeam={match.yourTeam}
          opponentHitsOnMyTeam={match.opponentHitsOnYourTeam ?? []}
          onGuess={guess}
          onSurrender={() => void surrender()}
          busy={busy}
          excludedPokedexNumbers={excludedGuesses}
          playerTheme={!match.yourTurn ? 'waiting' : 'default'}
        />
        </div>
      ) : null}
    </div>
  );
}
