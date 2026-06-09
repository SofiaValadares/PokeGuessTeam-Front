import { Link } from 'react-router-dom';
import { Button, Card, InlineAlert, PageShell, TextField } from '../../../../ds';
import { useLocalMatchSetup } from '../providers/LocalMatchSetupProvider';
import layout from '../../shared/matchLayout.module.css';

export function LocalMatchIdleView() {
  const { opponentName, updateOpponentName, startSetup, busy, error } = useLocalMatchSetup();

  return (
    <PageShell width="wide">
      <Card padding="md">
        <Link to="/">← Início</Link>
        <h1 className="ds-h1">Duelo local</h1>
        <p className="ds-body-muted">Dois jogadores no mesmo ecrã — regras no cliente.</p>
        {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
        <div className={layout.opponentField}>
          <TextField
            label="Nome do jogador 2"
            value={opponentName}
            onChange={(e) => updateOpponentName(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className={layout.startBtn}
          disabled={busy}
          onClick={startSetup}
        >
          Iniciar partida local
        </Button>
      </Card>
    </PageShell>
  );
}
