import { TeamPicker } from '../../shared/components/TeamPicker';
import { TeamSetupScreen } from '../../shared/components/TeamSetupScreen';
import { LoadingOverlay } from '../../../../ds';
import { useBotMatchSetup } from '../providers/BotMatchSetupProvider';

export function BotMatchSetupView() {
  const { loadingDex, team, updateTeam, sendTeam, goBack, busy, error } = useBotMatchSetup();

  return (
    <>
      <LoadingOverlay open={loadingDex} label="A carregar Pokédex…" fullscreen />
      <LoadingOverlay open={busy} label="A iniciar partida…" fullscreen />
      <TeamSetupScreen error={error} onBack={goBack}>
        {loadingDex ? null : (
          <TeamPicker
            value={team}
            onChange={updateTeam}
            minRegistered={12}
            onSubmit={() => void sendTeam()}
            loading={busy}
          />
        )}
      </TeamSetupScreen>
    </>
  );
}
