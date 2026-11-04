import { useMemo } from 'react';
import { RIVAL } from '../../../../lib/game/characters';
import { BotMatchBoard } from './BotMatchBoard';
import { BotGuessOverlay } from './BotGuessOverlay';
import { BotThinkingBanner } from './BotThinkingBanner';
import { HostHitOverlay } from './HostHitOverlay';
import { MatchResultModal } from '../../shared/components/MatchResultModal';
import { TeamCommitmentStrip } from '../../shared/components/TeamCommitmentStrip';
import { useMatchFinishRedirect } from '../../../../hooks/useMatchFinishRedirect';
import { guessedDexNumbersForSide } from '../../../../lib/game/matchGuesses';
import { gameResultLabel } from '../../../../lib/game/labels';
import { Button, InlineAlert } from '../../../../ds';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { prepareNewBotMatch } from '../slice/botMatchSlice';
import { selectBotMatch } from '../slice/botMatchSelectors';
import { useBotMatchPlay } from '../providers/BotMatchPlayProvider';
import layout from '../../shared/layout/matchLayout.module.css';

export function BotMatchPlayingView() {
  const dispatch = useAppDispatch();
  const { hostCommitment, opponentCommitment, commitmentVerified } = useAppSelector(selectBotMatch);
  const {
    hostName,
    matchView,
    clientState,
    guessLog,
    activeBotGuess,
    activeHostHit,
    botBusy,
    busy,
    error,
    guess,
    surrender,
    retryFinish,
  } = useBotMatchPlay();

  const matchEnded = clientState?.status === 'FINISHED';
  const resultReady = Boolean(matchView?.historyEntry);
  const showResultModal = matchEnded && resultReady;
  const pendingServerFinish = matchEnded && !resultReady;
  const { secondsLeft, goHomeNow } = useMatchFinishRedirect(showResultModal, true, () => {
    dispatch(prepareNewBotMatch());
  });

  const awaitingBotFinalResponse =
    clientState?.status === 'ACTIVE' && clientState.finalResponseFor === 'OPPONENT';

  const botTurnActive = activeBotGuess !== null || botBusy;
  const celebratingHit = activeHostHit != null;

  const yourTurn =
    clientState?.status === 'ACTIVE' &&
    clientState.currentTurn === 'HOST' &&
    !matchEnded &&
    !botTurnActive &&
    !celebratingHit;

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
        <div className={layout.matchBootCard} role="status">
          <span className={layout.matchBootPulse} aria-hidden />
          <p className={layout.matchBootTitle}>A preparar duelo…</p>
          <p className={layout.matchBootSub}>A sincronizar compromisso e Pokédex.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        layout.matchScreen,
        botTurnActive ? layout.matchScreenWaiting : '',
        celebratingHit ? layout.matchScreenHit : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {activeHostHit ? <HostHitOverlay key={activeHostHit.id} guess={activeHostHit} /> : null}

      {activeBotGuess ? (
        <BotGuessOverlay
          key={activeBotGuess.id}
          guess={activeBotGuess}
          opponentName={RIVAL.shortName}
        />
      ) : null}

      <TeamCommitmentStrip
        hostCommitment={hostCommitment}
        opponentCommitment={opponentCommitment}
        verified={commitmentVerified}
      />

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

      {awaitingBotFinalResponse && !botTurnActive && !celebratingHit ? (
        <BotThinkingBanner mode="final-response" />
      ) : null}

      {botBusy && !activeBotGuess ? <BotThinkingBanner mode="thinking" /> : null}

      {pendingServerFinish ? (
        <div className={layout.matchSaveRow}>
          <p className={layout.matchSaveText} role="status">
            A guardar resultado…
          </p>
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void retryFinish()}>
            Tentar gravar de novo
          </Button>
        </div>
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
            busy={busy || botTurnActive || pendingServerFinish || celebratingHit}
            excludedPokedexNumbers={excludedGuesses}
            playerTheme={botTurnActive || celebratingHit ? 'waiting' : 'default'}
            turnBannerText={
              celebratingHit
                ? 'Acertaste! A revelar o slot…'
                : botBusy && !activeBotGuess
                  ? `${RIVAL.shortName} está a escolher o chute…`
                  : activeBotGuess
                    ? `${RIVAL.shortName} chutou!`
                    : null
            }
          />
        </div>
      ) : null}
    </div>
  );
}
