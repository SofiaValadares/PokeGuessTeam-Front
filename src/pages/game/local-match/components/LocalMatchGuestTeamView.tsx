import { TeamPicker } from '../../../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../../../components/game/TeamSetupScreen';
import { useLocalMatchSetup } from '../providers/LocalMatchSetupProvider';

export function LocalMatchGuestTeamView() {
  const { opponentName, player2Team, updatePlayer2Team, confirmGuestTeam, goToHostTeam, busy, error } =
    useLocalMatchSetup();

  const guestName = opponentName.trim() || 'Jogador 2';

  return (
    <TeamSetupScreen
      title={`Equipe — ${guestName}`}
      subtitle="Monta a equipe secreta do jogador 2."
      onBack={goToHostTeam}
      error={error}
    >
      <TeamPicker
        value={player2Team}
        onChange={updatePlayer2Team}
        onSubmit={() => void confirmGuestTeam()}
        submitLabel="Iniciar partida"
        loading={busy}
      />
    </TeamSetupScreen>
  );
}
