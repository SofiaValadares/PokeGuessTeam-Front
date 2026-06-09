import { useMemo } from 'react';
import { RIVAL } from '../../../../lib/game/characters';
import { BotMatchBoard } from '../../../../components/game/BotMatchBoard';
import { BotGuessOverlay } from '../../../../components/game/BotGuessOverlay';
import { MatchResultModal } from '../../../../components/game/MatchResultModal';
import { useMatchFinishRedirect } from '../../../../hooks/useMatchFinishRedirect';
import { guessedDexNumbersForSide } from '../../../../lib/game/matchGuesses';
import { gameResultLabel } from '../../../../lib/game/labels';
import { InlineAlert } from '../../../../ds';
import { useAppDispatch } from '../../../../store/hooks';
import { prepareNewBotMatch } from '../slice/botMatchSlice';
import { useBotMatchPlay } from '../providers/BotMatchPlayProvider';
import layout from '../../shared/matchLayout.module.css';

export function BotMatchPlayingView() {
  const dispatch = useAppDispatch();
  const {
    hostName,
    matchView,
    clientState,
    guessLog,
    activeBotGuess,
    botBusy,
    busy,
    error,
    guess,
    surrender,
  } = useBotMatchPlay();

  const matchEnded = clientState?.status === 'FINISHED';
  const resultReady = Boolean(matchView?.historyEntry);
  const showResultModal = matchEnded && resultReady;
  const pendingServerFinish = matchEnded && !resultReady;
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(showResultModal, true, () => {
    dispatch(prepareNewBotMatch());
  });

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
    ? matchView.historyEntry.players.map(
        (p) => `${p.username ?? 'Jogador'}: ${gameResultLabel(p.result)} (${p.correctGuesses}/6)`,
      )
    : ['Partida terminada.'];

  if (!matchView) {
    return (
      <div className={layout.matchScreen}>
        <p className="ds-body-muted">A preparar duelo…</p>
      </div>
    );
  }

  return (
    <div
      className={[layout.matchScreen, botTurnActive ? layout.matchScreenWaiting : '']
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
          Encontraste os 6 — {RIVAL.shortName} tem uma ronda extra para tentar empatar.
        </p>
      ) : null}

      {botBusy && !activeBotGuess ? (
        <p className="ds-body-muted">{RIVAL.shortName} está a pensar…</p>
      ) : null}

      {pendingServerFinish ? (
        <p className="ds-body-muted">A guardar resultado…</p>
      ) : null}

      {!matchEnded || pendingServerFinish ? (
        <div className={layout.matchBoardWrap}>
          <BotMatchBoard
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
