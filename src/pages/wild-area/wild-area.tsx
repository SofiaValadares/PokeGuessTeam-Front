import { useNavigate } from 'react-router-dom';
import { Button, Card, PageShell } from '../../ds';

export default function WildAreaPage() {
  const navigate = useNavigate();

  return (
    <PageShell width="wide">
      <Card padding="md">
        <h1 className="ds-h1">Wild Area</h1>
        <p className="ds-body-muted" style={{ marginTop: 0 }}>
          Zona de exploração e capturas — por aqui vão aparecer rotas selvagens, encontros e ligação ao teu inventário.
          O núcleo do <strong>PokeTeamGuess</strong> são os duelos por dedução: montam-se dois times secretos de seis Pokémon e
          vence quem descobrir o adversário primeiro, usando pistas sobre tipo, geração, cor, altura e peso.
        </p>
        <p className="ds-body-muted">
          Enquanto o modo Wild Area não está ligado à API, usa a Pokédex para rever espécies e o PC para rever a tua coleção.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-3)', marginTop: 'var(--ds-space-6)' }}>
          <Button type="button" variant="secondary" size="md" onClick={() => navigate('/pokedex')}>
            Abrir Pokédex
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={() => navigate('/pc')}>
            Abrir PC
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={() => navigate('/')}>
            Início
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
