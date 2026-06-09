import { TeamPicker } from '../../../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../../../components/game/TeamSetupScreen';
import { useLocalMatchSetup } from '../providers/LocalMatchSetupProvider';
import layout from '../../shared/matchLayout.module.css';

export function LocalMatchGuestTeamView() {
  const { opponentName, player2Team, updatePlayer2Team, confirmGuestTeam, goToHostTeam, busy, error } =
    useLocalMatchSetup();

  return (
    <TeamSetupScreen error={error}>
      <p className={`ds-body-muted ${layout.guestTeamHint}`}>
        Equipa de <strong>{opponentName.trim()}</strong>
      </p>
      <TeamPicker
        value={player2Team}
        onChange={updatePlayer2Team}
        onSubmit={() => void confirmGuestTeam()}
        onBack={goToHostTeam}
        loading={busy}
      />
    </TeamSetupScreen>
  );
}
