import { useMemo } from 'react';
import { LocalMatchBoard } from './LocalMatchBoard';
import { MatchResultModal } from '../../shared/components/MatchResultModal';
import { useMatchFinishRedirect } from '../../../../hooks/useMatchFinishRedirect';
import { guessedDexNumbersForSide } from '../../../../lib/game/matchGuesses';
import { gameResultLabel } from '../../../../lib/game/labels';
import { turnHintFromGuess } from '../../shared/lib/turnHintFromGuess';
import { viewerOpponentTeamFromHistory } from '../../../../lib/game/historyPlayer';
import { buildViewerOpponentTeamSnapshot } from '../../../../lib/game/historyOpponentTeam';
import { useProfileMe } from '../../../../hooks/useProfileMe';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { InlineAlert } from '../../../../ds';
import { useAppDispatch } from '../../../../store/hooks';
import { prepareNewLocalMatch } from '../slice/localMatchSlice';
import { useLocalMatchPlay } from '../providers/LocalMatchPlayProvider';
import layout from '../../shared/layout/matchLayout.module.css';

export function LocalMatchPlayingView() {
  const dispatch = useAppDispatch();
  const { me } = useAuth();
  const { profileMe } = useProfileMe();
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
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(showResultModal, true, () => {
    dispatch(prepareNewLocalMatch());
  });

  const excludedGuesses = useMemo(
    () => guessedDexNumbersForSide(guessLog, viewerSide),
    [guessLog, viewerSide],
  );

  const finishedLines = useMemo(() => {
    if (!matchView?.historyEntry) return ['Partida terminada.'];

    const resultLines = matchView.historyEntry.players.map(
      (p) => `${p.username ?? 'Jogador'}: ${gameResultLabel(p.result)} (${p.correctGuesses}/6)`,
    );

    return resultLines;
  }, [matchView?.historyEntry]);

  const turnHint = useMemo(
    () => turnHintFromGuess(guessLog.at(-1), viewerSide),
    [guessLog, viewerSide],
  );

  const opponentTeam = useMemo(() => {
    const fromHistory = viewerOpponentTeamFromHistory(
      matchView?.historyEntry,
      profileMe?.profileId ?? null,
      me?.username ?? null,
    );
    if (fromHistory.length > 0) return fromHistory;
    if (!clientState) return [];
    return buildViewerOpponentTeamSnapshot(clientState, viewerSide);
  }, [matchView?.historyEntry, profileMe?.profileId, me?.username, clientState, viewerSide]);

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
        opponentTeam={opponentTeam}
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
          Ronda final — {activePlayerName} pode tentar empatar.
        </p>
      ) : null}

      {pendingServerFinish ? (
        <p className="ds-body-muted">A guardar resultado…</p>
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
            turnHint={turnHint}
            excludedPokedexNumbers={excludedGuesses}
            playerTheme={isGuestView ? 'guest' : 'default'}
          />
        </div>
      ) : null}
    </div>
  );
}
