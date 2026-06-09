import { accountDisplayName } from '../../../../auth/accountDisplay';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { TeamPicker } from '../../../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../../../components/game/TeamSetupScreen';
import { useLocalMatchSetup } from '../providers/LocalMatchSetupProvider';

export function LocalMatchHostTeamView() {
  const { me } = useAuth();
  const hostName = accountDisplayName(me);
  const { player1Team, updatePlayer1Team, goToGuestTeam, goToIdle, busy, error } = useLocalMatchSetup();

  return (
    <TeamSetupScreen
      title="Equipe — Jogador 1"
      subtitle={`${hostName} monta a equipe secreta de 6 Pokémon.`}
      onBack={goToIdle}
      error={error}
    >
      <TeamPicker
        value={player1Team}
        onChange={updatePlayer1Team}
        onSubmit={goToGuestTeam}
        submitLabel="Continuar"
        loading={busy}
      />
    </TeamSetupScreen>
  );
}
