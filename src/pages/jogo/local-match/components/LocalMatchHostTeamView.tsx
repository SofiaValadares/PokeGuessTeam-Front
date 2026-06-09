import { TeamPicker } from '../../../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../../../components/game/TeamSetupScreen';
import { useLocalMatchSetup } from '../providers/LocalMatchSetupProvider';

export function LocalMatchHostTeamView() {
  const { player1Team, updatePlayer1Team, goToGuestTeam, goToIdle, busy, error } = useLocalMatchSetup();

  return (
    <TeamSetupScreen error={error}>
      <TeamPicker
        value={player1Team}
        onChange={updatePlayer1Team}
        onSubmit={goToGuestTeam}
        onBack={goToIdle}
        loading={busy}
      />
    </TeamSetupScreen>
  );
}
