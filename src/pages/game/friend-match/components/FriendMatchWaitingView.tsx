import { useState } from 'react';
import { Copy } from 'lucide-react';
import { MatchSetupLayout } from '../../shared/layout/MatchSetupLayout';
import { useFriendMatch } from '../providers/FriendMatchProvider';
import { FriendMatchResumeBanner } from './FriendMatchResumeBanner';
import { FriendMatchSyncAction } from './FriendMatchSyncAction';
import styles from './friend-match.module.css';

export function FriendMatchWaitingView() {
  const { match, error, abandonAndGoHome } = useFriendMatch();
  const [copied, setCopied] = useState(false);

  if (!match) return null;

  const isHost = match.yourSide === 'HOST';
  const opponentName =
    match.yourSide === 'HOST' ? (match.guest?.username ?? 'Amigo') : match.host.username;
  const guestJoined = Boolean(match.guest?.userId);
  const yourReady = isHost ? match.host.teamReady : (match.guest?.teamReady ?? false);
  const opponentReady = isHost ? (match.guest?.teamReady ?? false) : match.host.teamReady;

  const waitingForGuest = isHost && !guestJoined;
  const waitingForOpponentTeam = yourReady && !opponentReady;
  const bothReady = yourReady && opponentReady;

  const copyCode = async () => {
    if (!match.joinCode) return;
    try {
      await navigator.clipboard.writeText(match.joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const title = waitingForGuest
    ? 'Aguarda o convidado'
    : waitingForOpponentTeam
      ? 'Equipe confirmada'
      : bothReady
        ? 'A iniciar partida'
        : 'Sala de espera';

  const subtitle = waitingForGuest
    ? 'Partilha o código abaixo. A partida começa quando o amigo entrar com a equipe dele.'
    : waitingForOpponentTeam
      ? 'A tua equipe está pronta. Aguarda o adversário entrar na sala.'
      : bothReady
        ? 'Ambos na sala — carrega em Iniciar partida quando estiveres pronto.'
        : 'Aguarda o adversário entrar na sala.';

  return (
    <MatchSetupLayout
      title={title}
      subtitle={subtitle}
      onBack={() => void abandonAndGoHome()}
    >
      {waitingForGuest && match.joinCode ? (
        <div className={styles.codeCard}>
          <p className={styles.codeLabel}>Código da sala</p>
          <p className={styles.codeValue}>{match.joinCode}</p>
          <p className={styles.codeHint}>Envia este código ao teu amigo.</p>
          <button type="button" className={styles.setupCodeCopyBtn} onClick={() => void copyCode()}>
            <Copy size={16} aria-hidden />
            {copied ? 'Copiado' : 'Copiar código'}
          </button>
        </div>
      ) : null}

      <div className={styles.waitingBody}>
        <FriendMatchResumeBanner />

        <p className="ds-body-muted" role="status">
          {waitingForGuest
            ? 'À espera de um jogador entrar na sala…'
            : waitingForOpponentTeam
              ? `${opponentName} ainda está a montar a equipe…`
              : bothReady
                ? 'Pronto para começar — usa o botão abaixo.'
                : `${opponentName} ainda não confirmou a equipe…`}
        </p>

        {error ? (
          <p className="ds-body-muted" role="alert">
            {error}
          </p>
        ) : null}

        <FriendMatchSyncAction
          mode="start"
          label={waitingForGuest ? 'Verificar convidado' : 'Iniciar partida'}
        />

        <div className={styles.playersList}>
          <span
            className={[styles.playerChip, match.host.teamReady ? styles.playerChipReady : '']
              .filter(Boolean)
              .join(' ')}
          >
            {match.host.username}
            {match.host.teamReady ? ' ✓' : ' …'}
          </span>
          {match.guest?.userId ? (
            <span
              className={[styles.playerChip, match.guest.teamReady ? styles.playerChipReady : '']
                .filter(Boolean)
                .join(' ')}
            >
              {match.guest.username}
              {match.guest.teamReady ? ' ✓' : ' …'}
            </span>
          ) : (
            <span className={styles.playerChip}>À espera do convidado…</span>
          )}
        </div>
      </div>
    </MatchSetupLayout>
  );
}
