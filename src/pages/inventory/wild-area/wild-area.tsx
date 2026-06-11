import { Card, InlineAlert, PageSection, PageShell } from '../../../ds';
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
        <PageSection
          title="Área selvagem"
          subtitle={
            collection
              ? `Fragmentos de Poké Bola: ${collection.pokeballFragments} / ${collection.fragmentsPerPokeBall}`
              : 'Usa Pokébolas do inventário para capturar Pokémon selvagens.'
          }
          headingLevel="h1"
          divider
        />

        <PageSection
          grow
          bodyClassName={`${styles.content} ds-motion-stagger`}
        >
          {error ? (
            <InlineAlert tone="error" role="alert">
              {error}
            </InlineAlert>
          ) : null}
          {cacheLoading && !collection ? (
            <p className="ds-body-muted">A carregar inventário…</p>
          ) : (
            <GachaBallGrid collection={collection} drawingType={drawingType} onDraw={draw} />
          )}

          {lastDraw ? <GachaResultPanel key={lastDraw.pokemon.number} draw={lastDraw} /> : null}
        </PageSection>

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
