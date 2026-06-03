import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getLocalMatch,
  startLocalMatch,
  submitLocalGuess,
  submitLocalTeam,
  surrenderLocalMatch,
} from '../../api/gameApi';
import type { BotMatchGuessFeedbackDto, LocalMatchStateDto } from '../../api/types/game';
import { ApiError } from '../../api/http';
import { MatchBoard } from '../../components/game/MatchBoard';
import { TeamPicker } from '../../components/game/TeamPicker';
import { gameResultLabel, playerSideLabel } from '../../lib/gameLabels';
import { Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import hubStyles from './jogo.module.css';

function appendLog(prev: BotMatchGuessFeedbackDto[], added: BotMatchGuessFeedbackDto[]) {
  const ids = new Set(prev.map((g) => g.id));
  const next = [...prev];
  for (const g of added) {
    if (!ids.has(g.id)) next.push(g);
  }
  return next;
}

export default function LocalMatchPage() {
  const [match, setMatch] = useState<LocalMatchStateDto | null>(null);
  const [guessLog, setGuessLog] = useState<BotMatchGuessFeedbackDto[]>([]);
  const [opponentName, setOpponentName] = useState('Ash');
  const [player1Team, setPlayer1Team] = useState<number[]>([]);
  const [player2Team, setPlayer2Team] = useState<number[]>([]);
  const [, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyAction = useCallback(
    (state: LocalMatchStateDto, feedbacks: BotMatchGuessFeedbackDto[]) => {
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
      const m = await getLocalMatch();
      setMatch(m);
      setOpponentName(m.opponentName);
      setGuessLog(m.recentGuesses ?? []);
      if (m.playerTeam.length) setPlayer1Team(m.playerTeam);
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

  const start = async () => {
    const name = opponentName.trim();
    if (name.length < 3) {
      setError('Nome do jogador 2: mínimo 3 caracteres.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const m = await startLocalMatch(name);
      setMatch(m);
      setGuessLog([]);
      setPlayer1Team([]);
      setPlayer2Team([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível iniciar.');
    } finally {
      setBusy(false);
    }
  };

  const sendTeam = async (side: 'USER' | 'BOT', team: number[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await submitLocalTeam(side, team);
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
      const res = await submitLocalGuess(dex);
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
      const res = await surrenderLocalMatch();
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro.');
    } finally {
      setBusy(false);
    }
  };

  if (!match) {
    return (
      <PageShell width="wide">
        <Card padding="md">
          <Link to="/jogo">← Duelos</Link>
          <h1 className="ds-h1">Duelo local</h1>
          <p className="ds-body-muted">Dois jogadores no mesmo ecrã — regras no servidor.</p>
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
            onClick={() => void start()}
          >
            Iniciar partida local
          </Button>
        </Card>
      </PageShell>
    );
  }

  const finished = match.status === 'FINISHED';
  const setup = match.status === 'SETUP';
  const activePlayerName =
    match.currentTurn === 'USER' ? 'Jogador 1' : match.opponentName;
  const isPlayer1Turn = match.currentTurn === 'USER';

  const finishedMsg = match.historyEntry
    ? match.historyEntry.players.map((p) => gameResultLabel(p.result)).join(' · ')
    : null;

  return (
    <PageShell width="fluid" className={hubStyles.shell}>
      <Card padding="md">
        <Link to="/jogo">← Duelos</Link>
        <h1 className="ds-h1">Duelo local — {match.opponentName}</h1>
        {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

        {setup ? (
          <>
            {!match.playerTeamReady ? (
              <section className={hubStyles.setupBlock}>
                <h2>Equipa do jogador 1</h2>
                <TeamPicker
                  value={player1Team}
                  onChange={setPlayer1Team}
                  onSubmit={() => void sendTeam('USER', player1Team)}
                  loading={busy}
                />
              </section>
            ) : null}
            {!match.opponentTeamReady ? (
              <section className={hubStyles.setupBlock}>
                <h2>Equipa do jogador 2 ({match.opponentName})</h2>
                <TeamPicker
                  value={player2Team}
                  onChange={setPlayer2Team}
                  onSubmit={() => void sendTeam('BOT', player2Team)}
                  submitLabel="Confirmar equipa do jogador 2"
                  loading={busy}
                />
              </section>
            ) : null}
            {match.playerTeamReady && match.opponentTeamReady ? (
              <p className="ds-body-muted">A iniciar partida…</p>
            ) : null}
          </>
        ) : (
          <MatchBoard
            playerName={isPlayer1Turn ? 'Jogador 1' : match.opponentName}
            opponentName={isPlayer1Turn ? match.opponentName : 'Jogador 1'}
            userScore={isPlayer1Turn ? match.playerCorrectGuesses : match.opponentCorrectGuesses}
            opponentScore={isPlayer1Turn ? match.opponentCorrectGuesses : match.playerCorrectGuesses}
            isYourTurn
            status={finished ? 'FINISHED' : 'ACTIVE'}
            opponentKnowledge={match.opponentKnowledge}
            guessLog={guessLog}
            onGuess={guess}
            onSurrender={() => void surrender()}
            busy={busy}
            localLabels
            finishedMessage={
              finished
                ? `${finishedMsg ?? 'Fim'} — última vez: ${playerSideLabel(match.currentTurn, 'local')}`
                : `Vez de ${activePlayerName}`
            }
          />
        )}
      </Card>
    </PageShell>
  );
}
