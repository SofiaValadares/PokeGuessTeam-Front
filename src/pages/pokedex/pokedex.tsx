import { Card, PageShell } from '../../ds';

export default function PokedexPage() {
  return (
    <PageShell width="wide">
      <Card padding="md">
        <h1 className="ds-h1">Pokédex</h1>
        <p className="ds-body-muted" style={{ marginBottom: 0 }}>
          Lista de Pokémon em breve.
        </p>
      </Card>
    </PageShell>
  );
}
