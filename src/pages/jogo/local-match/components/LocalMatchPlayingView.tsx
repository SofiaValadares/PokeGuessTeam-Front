import { useMemo } from 'react';
import { LocalMatchBoard } from '../../../../components/game/LocalMatchBoard';
import { MatchResultModal } from '../../../../components/game/MatchResultModal';
import { useMatchFinishRedirect } from '../../../../hooks/useMatchFinishRedirect';
import { guessedDexNumbersForSide } from '../../../../lib/game/matchGuesses';
import { gameResultLabel } from '../../../../lib/game/labels';
import { InlineAlert } from '../../../../ds';
import { useLocalMatchPlay } from '../providers/LocalMatchPlayProvider';
import layout from '../../shared/matchLayout.module.css';

export function LocalMatchPlayingView() {
  const {
    matchView,
    clientState,
    guessLog,
    viewerSide,
    busy,
    error,
    guess,
    surrender,
  } = useLocalMatchPlay();

  const matchEnded = clientState?.status === 'FINISHED';
  const resultReady = Boolean(matchView?.historyEntry);
  const showResultModal = matchEnded && resultReady;
  const pendingServerFinish = matchEnded && !resultReady;
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(showResultModal);

  const excludedGuesses = useMemo(
    () => guessedDexNumbersForSide(guessLog, viewerSide),
    [guessLog, viewerSide],
  );

  if (!matchView || !clientState) {
    return (
      <div className={layout.matchScreen}>
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

  const isYourTurn =
    clientState.status === 'ACTIVE' &&
    clientState.currentTurn === viewerSide &&
    !busy &&
    !pendingServerFinish;

  return (
    <div
      className={[layout.matchScreen, isGuestView ? layout.matchScreenGuest : '']
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

      {awaitingFinalResponse ? (
        <p className="ds-body-muted" role="status">
          Final round — {activePlayerName} can try to tie.
        </p>
      ) : null}

      {pendingServerFinish ? (
        <p className="ds-body-muted">Saving result…</p>
      ) : null}

      {!matchEnded || pendingServerFinish ? (
        <div className={layout.matchBoardWrap}>
          <LocalMatchBoard
            playerName={activePlayerName ?? 'Jogador'}
            opponentName={opponentNameForBoard ?? 'Opponent'}
            userScore={
              viewerSide === 'HOST' ? matchView.hostCorrectGuesses : matchView.opponentCorrectGuesses
            }
            opponentScore={
              viewerSide === 'HOST' ? matchView.opponentCorrectGuesses : matchView.hostCorrectGuesses
            }
            isYourTurn={isYourTurn}
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
