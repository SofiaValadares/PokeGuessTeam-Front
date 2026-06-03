import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createFriendMatch,
  getFriendMatch,
  joinFriendMatch,
  submitFriendGuess,
  submitFriendTeam,
  surrenderFriendMatch,
} from '../../api/gameApi';
import type { BotMatchGuessFeedbackDto, FriendMatchStateDto } from '../../api/types/game';
import { ApiError } from '../../api/http';
import { useAuth } from '../../auth/AuthContext';
import { accountDisplayName } from '../../auth/accountDisplay';
import { MatchBoard } from '../../components/game/MatchBoard';
import { TeamPicker } from '../../components/game/TeamPicker';
import { gameResultLabel } from '../../lib/gameLabels';
import { Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import gameStyles from '../../components/game/game.module.css';
import hubStyles from './jogo.module.css';

function appendLog(prev: BotMatchGuessFeedbackDto[], added: BotMatchGuessFeedbackDto[]) {
  const ids = new Set(prev.map((g) => g.id));
  const next = [...prev];
  for (const g of added) {
    if (!ids.has(g.id)) next.push(g);
  }
  return next;
}

export default function FriendMatchPage() {
  const { me } = useAuth();
  const [match, setMatch] = useState<FriendMatchStateDto | null>(null);
  const [guessLog, setGuessLog] = useState<BotMatchGuessFeedbackDto[]>([]);
  const [team, setTeam] = useState<number[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyAction = useCallback(
    (state: FriendMatchStateDto, feedbacks: BotMatchGuessFeedbackDto[]) => {
      setMatch(state);
      if (feedbacks.length) setGuessLog((prev) => appendLog(prev, feedbacks));
      else if (state.recentGuesses.length) setGuessLog(state.recentGuesses);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getFriendMatch();
      setMatch(m);
      setGuessLog(m.recentGuesses ?? []);
      if (m.yourTeam?.length) setTeam(m.yourTeam);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setMatch(null);
      } else {
        setError(e instanceof ApiError ? e.message : 'Erro ao carregar.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!match || match.status !== 'SETUP' || match.guest) return;
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [match, load]);

  const host = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await createFriendMatch();
      setMatch(m);
      setGuessLog([]);
      setTeam([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível criar sala.');
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    const code = joinCode.trim();
    if (code.length !== 6) {
      setError('Código com 6 caracteres.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const m = await joinFriendMatch(code);
      setMatch(m);
      setGuessLog([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Código inválido ou sala cheia.');
    } finally {
      setBusy(false);
    }
  };

  const sendTeam = async () => {
    setBusy(true);
    try {
      const res = await submitFriendTeam(team);
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Equipa inválida.');
    } finally {
      setBusy(false);
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

  const finished = match?.status === 'FINISHED';
  const setup = match?.status === 'SETUP';

  return (
    <PageShell width="fluid" className={hubStyles.shell}>
      <Card padding="md">
        <Link to="/jogo">← Duelos</Link>
        <h1 className="ds-h1">Duelo com amigo</h1>

        {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

        {loading && !match ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : !match ? (
          <div className={hubStyles.setupBlock}>
            <h2>Criar sala (anfitrião)</h2>
            <Button type="button" variant="primary" disabled={busy} onClick={() => void host()}>
              Criar partida e obter código
            </Button>
            <h2 style={{ marginTop: 'var(--ds-space-8)' }}>Entrar com código</h2>
            <TextField
              label="Código da sala"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void join()}>
              Entrar
            </Button>
          </div>
        ) : setup ? (
          <>
            {match.joinCode ? (
              <p>
                Código da sala: <span className={gameStyles.lobbyCode}>{match.joinCode}</span>
              </p>
            ) : null}
            <ul className="ds-body-muted" style={{ paddingLeft: '1.25rem' }}>
              <li>Anfitrião: {match.host.username} {match.host.teamReady ? '✓ equipa' : '…'}</li>
              <li>
                Convidado:{' '}
                {match.guest ? `${match.guest.username} ${match.guest.teamReady ? '✓ equipa' : '…'}` : 'à espera'}
              </li>
            </ul>
            {!match.yourTeam.length || match.yourTeam.length < 6 ? (
              <TeamPicker value={team} onChange={setTeam} onSubmit={() => void sendTeam()} loading={busy} />
            ) : (
              <p className="ds-body-muted">Equipa enviada. À espera do adversário…</p>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => void load()} disabled={busy}>
              Atualizar estado
            </Button>
          </>
        ) : (
          <MatchBoard
            playerName={me ? accountDisplayName(me) : 'Tu'}
            opponentName={opponentName}
            userScore={match.yourCorrectGuesses}
            opponentScore={match.opponentCorrectGuesses}
            isYourTurn={match.yourTurn}
            status={finished ? 'FINISHED' : 'ACTIVE'}
            opponentKnowledge={match.opponentKnowledge}
            guessLog={guessLog}
            onGuess={guess}
            onSurrender={() => void surrender()}
            busy={busy}
            finishedMessage={
              match.historyEntry
                ? match.historyEntry.players.map((p) => gameResultLabel(p.result)).join(' · ')
                : undefined
            }
          />
        )}
      </Card>
    </PageShell>
  );
}
