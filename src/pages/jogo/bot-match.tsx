import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  abandonBotMatch,
  getBotMatch,
  startBotMatch,
  submitBotGuess,
  submitBotTeam,
  surrenderBotMatch,
} from '../../api/gameApi';
import type { BotMatchGuessFeedbackDto, BotMatchStateDto } from '../../api/types/game';
import { ApiError } from '../../api/http';
import { MatchBoard } from '../../components/game/MatchBoard';
import { TeamPicker } from '../../components/game/TeamPicker';
import { gameResultLabel } from '../../lib/gameLabels';
import { Button, Card, InlineAlert, PageShell } from '../../ds';
import hubStyles from './jogo.module.css';

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
  const [match, setMatch] = useState<BotMatchStateDto | null>(null);
  const [guessLog, setGuessLog] = useState<BotMatchGuessFeedbackDto[]>([]);
  const [team, setTeam] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyAction = useCallback((state: BotMatchStateDto, feedbacks: BotMatchGuessFeedbackDto[]) => {
    setMatch(state);
    if (feedbacks.length) setGuessLog((prev) => appendLog(prev, feedbacks));
    else if (state.recentGuesses.length) setGuessLog(state.recentGuesses);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getBotMatch();
      setMatch(m);
      setGuessLog(m.recentGuesses ?? []);
      if (m.userTeam?.length) setTeam(m.userTeam);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setMatch(null);
      } else {
        setError(e instanceof ApiError ? e.message : 'Erro ao carregar partida.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const m = await startBotMatch();
      setMatch(m);
      setGuessLog([]);
      setTeam([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível iniciar a partida.');
    } finally {
      setBusy(false);
    }
  };

  const sendTeam = async () => {
    if (!match) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitBotTeam(team);
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Equipa inválida.');
    } finally {
      setBusy(false);
    }
  };

  const guess = async (dex: number) => {
    setBusy(true);
    setError(null);
    try {
      const res = await submitBotGuess(dex);
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
      const res = await surrenderBotMatch();
      applyAction(res.match, res.turnFeedbacks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao desistir.');
    } finally {
      setBusy(false);
    }
  };

  const abandon = async () => {
    setBusy(true);
    try {
      await abandonBotMatch();
      navigate('/jogo');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao abandonar.');
    } finally {
      setBusy(false);
    }
  };

  const finished = match?.status === 'FINISHED';
  const setup = match?.status === 'SETUP';
  const yourTurn = match?.status === 'ACTIVE' && match.currentTurn === 'USER';

  const finishedMsg = match?.historyEntry
    ? match.historyEntry.players
        .map((p) => `${p.username ?? 'Jogador'}: ${gameResultLabel(p.result)} (${p.correctGuesses}/6)`)
        .join(' · ')
    : null;

  return (
    <PageShell width="fluid" className={hubStyles.shell}>
      <Card padding="md">
        <div className={hubStyles.toolbar}>
          <Link to="/jogo">← Duelos</Link>
          {!match ? (
            <Button type="button" variant="primary" size="sm" disabled={busy} onClick={() => void start()}>
              Nova partida vs Bot
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void abandon()}>
              Abandonar partida
            </Button>
          )}
        </div>

        <h1 className="ds-h1">Duelo vs Bot</h1>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        {loading ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : !match ? (
          <p className="ds-body-muted">Não há partida ativa. Inicia uma nova contra o Rival (IA).</p>
        ) : setup ? (
          <section className={hubStyles.setupBlock}>
            <h2>Prepara a tua equipa secreta</h2>
            <TeamPicker value={team} onChange={setTeam} onSubmit={() => void sendTeam()} loading={busy} />
          </section>
        ) : (
          <>
            {finished && match.historyEntry ? (
              <div className={hubStyles.finishedPanel}>
                <h2>Partida terminada</h2>
                <p>{finishedMsg}</p>
              </div>
            ) : null}
            <MatchBoard
              playerName="Tu"
              opponentName="Rival (Bot)"
              userScore={match.userCorrectGuesses}
              opponentScore={match.opponentCorrectGuesses}
              isYourTurn={yourTurn}
              status={finished ? 'FINISHED' : 'ACTIVE'}
              opponentKnowledge={match.opponentKnowledge}
              guessLog={guessLog}
              onGuess={guess}
              onSurrender={() => void surrender()}
              busy={busy}
              finishedMessage={finishedMsg}
            />
          </>
        )}
      </Card>
    </PageShell>
  );
}
