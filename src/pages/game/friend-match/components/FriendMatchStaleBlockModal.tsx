import { ConfirmModal } from '../../../../ds';
import { useFriendMatch } from '../providers/FriendMatchProvider';

export function FriendMatchStaleBlockModal() {
  const {
    staleBlock,
    match,
    leavingMatch,
    continueStaleBlock,
    abandonStaleBlockAndRetry,
  } = useFriendMatch();

  if (!staleBlock) return null;

  const statusLabel =
    match?.status === 'ACTIVE'
      ? 'em curso'
      : match?.status === 'SETUP'
        ? 'em espera'
        : 'pendente';

  const retryLabel =
    staleBlock.action === 'create' ? 'criar uma sala nova' : 'entrar noutra sala';

  return (
    <ConfirmModal
      open
      title="Partida anterior encontrada"
      description={`Já tens uma partida amigável ${statusLabel}. Podes continuar onde ficaste ou sair para ${retryLabel}.`}
      confirmLabel="Continuar partida"
      cancelLabel={leavingMatch ? 'A sair…' : 'Sair e tentar de novo'}
      onConfirm={() => continueStaleBlock()}
      onCancel={() => {
        if (leavingMatch) return;
        void abandonStaleBlockAndRetry();
      }}
      confirming={false}
    />
  );
}
