import { TeamPicker } from '../../../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../../../components/game/TeamSetupScreen';
import { useBotMatchSetup } from '../providers/BotMatchSetupProvider';

export function BotMatchSetupView() {
  const { loadingDex, team, updateTeam, sendTeam, goBack, busy, error } = useBotMatchSetup();

  return (
    <TeamSetupScreen error={error} onBack={goBack}>
      {loadingDex ? (
        <p className="ds-body-muted">A carregar Pokédex…</p>
      ) : (
        <TeamPicker
          value={team}
          onChange={updateTeam}
          minRegistered={12}
          onSubmit={() => void sendTeam()}
          loading={busy}
        />
      )}
    </TeamSetupScreen>
  );
}
