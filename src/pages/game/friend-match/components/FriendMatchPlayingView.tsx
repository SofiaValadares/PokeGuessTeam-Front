import { useMemo } from 'react';
import { accountDisplayName } from '../../../../auth/accountDisplay';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { FriendMatchBoard } from '../../../../components/game/FriendMatchBoard';
import { MatchResultModal } from '../../../../components/game/MatchResultModal';
import { useMatchFinishRedirect } from '../../../../hooks/useMatchFinishRedirect';
import { guessedDexNumbersForSide } from '../../../../lib/game/matchGuesses';
import { gameResultLabel } from '../../../../lib/game/labels';
import {
  formatMatchRewardLines,
  friendMatchRewardForResult,
} from '../../../../lib/game/matchRewardLabels';
import { InlineAlert } from '../../../../ds';
import {
  FINISH_MODAL_SECONDS,
  useFriendMatch,
} from '../providers/FriendMatchProvider';
import layout from '../../shared/matchLayout.module.css';

export function FriendMatchPlayingView() {
  const { me } = useAuth();
  const { match, finishReward, guessSending, busy, error, guess, surrender, clearMatch } =
    useFriendMatch();
  const playerName = accountDisplayName(me);

  const matchEnded = match?.status === 'FINISHED';
  const resultReady = Boolean(match?.historyEntry);
  const showResultModal = Boolean(matchEnded && resultReady);
  const pendingServerFinish = Boolean(matchEnded && !resultReady);
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(
    showResultModal,
    true,
    clearMatch,
    FINISH_MODAL_SECONDS,
  );

  const opponentName =
    match?.yourSide === 'HOST'
      ? (match.guest?.username ?? 'Amigo')
      : (match?.host.username ?? 'Amigo');

  const excludedGuesses = useMemo(
    () => guessedDexNumbersForSide(match?.recentGuesses ?? [], match?.yourSide ?? 'HOST'),
    [match?.recentGuesses, match?.yourSide],
  );

  const yourHistorySlot = match?.yourSide === 'HOST' ? 1 : 2;
  const yourResult = match?.historyEntry?.players.find((p) => p.slot === yourHistorySlot)?.result;

  const finishedLines = useMemo(() => {
    if (!match?.historyEntry) return ['Partida terminada.'];

    const resultLines = match.historyEntry.players.map(
      (p) => `${p.username ?? 'Jogador'}: ${gameResultLabel(p.result)} (${p.correctGuesses}/6)`,
    );

    const reward =
      finishReward ?? (yourResult ? friendMatchRewardForResult(yourResult) : null);
    const rewardLines = formatMatchRewardLines(reward);

    if (rewardLines.length === 0) return resultLines;
    return [...resultLines, '—', 'Recompensas:', ...rewardLines];
  }, [match?.historyEntry, finishReward, yourResult]);

  if (!match) {
    return (
      <div className={layout.matchScreen}>
        <p className="ds-body-muted">A preparar duelo…</p>
      </div>
    );
  }

  const isYourTurn =
    match.status === 'ACTIVE' &&
    match.currentTurn === match.yourSide &&
    !busy &&
    !guessSending &&
    !pendingServerFinish;

  const opponentTurnActive =
    match.status === 'ACTIVE' &&
    match.currentTurn !== match.yourSide &&
    !matchEnded &&
    !busy &&
    !guessSending &&
    !showResultModal;

  const youTriggeredFinalResponse =
    match.status === 'ACTIVE' &&
    match.finalResponseFor != null &&
    match.finalResponseFor !== match.yourSide;

  const opponentFinalResponseTurn =
    match.status === 'ACTIVE' &&
    match.finalResponseFor != null &&
    match.currentTurn === match.finalResponseFor &&
    match.currentTurn !== match.yourSide;

  return (
    <div
      className={[layout.matchScreen, opponentTurnActive ? layout.matchScreenWaiting : '']
        .filter(Boolean)
        .join(' ')}
    >
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

      {youTriggeredFinalResponse && !opponentTurnActive ? (
        <p className="ds-body-muted" role="status">
          Encontraste os 6 — {opponentName} tem uma ronda extra para tentar empatar.
        </p>
      ) : null}

      {opponentFinalResponseTurn && !opponentTurnActive ? (
        <p className="ds-body-muted" role="status">
          Ronda final — {opponentName} pode tentar empatar.
        </p>
      ) : null}

      {opponentTurnActive ? (
        <p className="ds-body-muted" role="status">
          {opponentName} está a pensar…
        </p>
      ) : null}

      {matchEnded && resultReady && yourResult === 'DESISTENCE' ? (
        <p className="ds-body-muted" role="status">
          Desististe da partida.
        </p>
      ) : null}

      {matchEnded && resultReady && yourResult === 'WIN' ? (
        <p className="ds-body-muted" role="status">
          {opponentName} desistiu — vitória para ti.
        </p>
      ) : null}

      {pendingServerFinish ? (
        <p className="ds-body-muted">A guardar resultado…</p>
      ) : null}

      {!matchEnded || pendingServerFinish ? (
        <div className={layout.matchBoardWrap}>
          <FriendMatchBoard
            playerName={playerName}
            opponentName={opponentName}
            userScore={match.yourCorrectGuesses}
            opponentScore={match.opponentCorrectGuesses}
            isYourTurn={isYourTurn}
            status={matchEnded ? 'FINISHED' : 'ACTIVE'}
            opponentKnowledge={match.opponentKnowledge}
            myTeam={match.yourTeam}
            opponentHitsOnMyTeam={match.opponentHitsOnYourTeam}
            onGuess={guess}
            onSurrender={() => void surrender()}
            busy={busy || guessSending || pendingServerFinish}
            guessLoading={guessSending}
            excludedPokedexNumbers={excludedGuesses}
            playerTheme={opponentTurnActive ? 'waiting' : 'default'}
          />
        </div>
      ) : null}
    </div>
  );
}
