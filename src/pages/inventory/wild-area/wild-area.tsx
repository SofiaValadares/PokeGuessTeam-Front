import { Card, InlineAlert, PageShell } from '../../../ds';
import { GachaBallGrid } from './components/GachaBallGrid';
import { GachaDrawingOverlay } from './components/GachaDrawingOverlay';
import { GachaResultPanel } from './components/GachaResultPanel';
import { WildAreaProvider } from './providers/WildAreaProvider';
import { useWildAreaGacha } from './providers/WildAreaGachaProvider';
import { useWildAreaInventory } from './providers/WildAreaInventoryProvider';
import styles from './wild-area.module.css';

function WildAreaContent() {
  const { collection, cacheLoading } = useWildAreaInventory();
  const { lastDraw, drawingType, error, draw } = useWildAreaGacha();

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <Card padding="md" className={styles.card}>
        <div className={styles.toolbar}>
          <h1 className="ds-h1">Área selvagem</h1>
          {collection ? (
            <p className={styles.fragments}>
              Fragmentos de Poké Bola: {collection.pokeballFragments} / {collection.fragmentsPerPokeBall}
            </p>
          ) : null}
        </div>

        <p className={styles.intro}>
          Usa uma Poké Bola do teu inventário para tentar capturar um Pokémon selvagem. Cada tipo de bola altera as probabilidades de raridade.
        </p>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        <div className={styles.content}>
          {cacheLoading && !collection ? (
            <p className="ds-body-muted">A carregar inventário…</p>
          ) : (
            <GachaBallGrid collection={collection} drawingType={drawingType} onDraw={draw} />
          )}

          {lastDraw ? <GachaResultPanel key={lastDraw.pokemon.number} draw={lastDraw} /> : null}
        </div>

        {drawingType ? <GachaDrawingOverlay drawingType={drawingType} /> : null}
      </Card>
    </PageShell>
  );
}

export default function WildAreaPage() {
  return (
    <WildAreaProvider>
      <WildAreaContent />
    </WildAreaProvider>
  );
}
