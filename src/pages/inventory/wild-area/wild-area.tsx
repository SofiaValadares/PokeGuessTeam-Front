import { InlineAlert, PageShell } from '../../../ds';
import { GachaBallGrid } from './components/GachaBallGrid';
import { GachaDrawingOverlay } from './components/GachaDrawingOverlay';
import { GachaResultPanel } from './components/GachaResultPanel';
import { WildAreaProvider } from './providers/WildAreaProvider';
import { useWildAreaGacha, type GachaDrawCount } from './providers/WildAreaGachaProvider';
import { useWildAreaInventory } from './providers/WildAreaInventoryProvider';
import styles from './wild-area.module.css';

function FragmentChip({
  fragments,
  perBall,
}: {
  fragments: number;
  perBall: number;
}) {
  const pct = Math.min(100, Math.round((fragments / Math.max(1, perBall)) * 100));
  return (
    <div className={styles.fragChip} aria-label={`Fragmentos ${fragments} de ${perBall}`}>
      <span className={styles.fragChipLabel}>Fragmentos</span>
      <span className={styles.fragChipCount}>
        {fragments}/{perBall}
      </span>
      <span className={styles.fragChipTrack} aria-hidden>
        <span className={styles.fragChipFill} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

function DrawCountToggle({
  value,
  onChange,
  disabled,
}: {
  value: GachaDrawCount;
  onChange: (count: GachaDrawCount) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.countToggle} role="group" aria-label="Quantidade de bolas">
      {([1, 10] as const).map((n) => (
        <button
          key={n}
          type="button"
          className={value === n ? styles.countToggleActive : styles.countToggleBtn}
          aria-pressed={value === n}
          disabled={disabled}
          onClick={() => onChange(n)}
        >
          ×{n}
        </button>
      ))}
    </div>
  );
}

function WildAreaContent() {
  const { collection, cacheLoading } = useWildAreaInventory();
  const { lastDraws, drawingType, drawCount, setDrawCount, error, draw, dismissResult } =
    useWildAreaGacha();

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <div className={styles.stage}>
        <header className={styles.topBar}>
          <div className={styles.topBarCopy}>
            <p className={styles.kicker}>Inventário</p>
            <h1 className={styles.title}>Área selvagem</h1>
          </div>
          <div className={styles.topBarActions}>
            <DrawCountToggle
              value={drawCount}
              onChange={setDrawCount}
              disabled={drawingType != null}
            />
            {collection ? (
              <FragmentChip
                fragments={collection.pokeballFragments}
                perBall={collection.fragmentsPerPokeBall}
              />
            ) : null}
          </div>
        </header>

        <p className={styles.lead}>
          {drawCount === 1
            ? 'Escolhe uma bola abaixo para tentar uma captura.'
            : 'Modo ×10 — escolhe uma bola com stock suficiente para 10 capturas.'}
        </p>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        <div className={styles.arena}>
          <div className={styles.arenaGlow} aria-hidden />

          {cacheLoading && !collection ? (
            <p className={styles.loadingCopy}>A carregar inventário…</p>
          ) : (
            <GachaBallGrid
              collection={collection}
              drawingType={drawingType}
              drawCount={drawCount}
              onDraw={draw}
            />
          )}

          {lastDraws.length > 0 && !drawingType ? (
            <GachaResultPanel
              key={lastDraws.map((d) => d.pokemon.number).join('-')}
              draws={lastDraws}
              onDismiss={dismissResult}
            />
          ) : (
            <p className={styles.arenaHint}>O resultado da captura aparece aqui.</p>
          )}

          {drawingType ? (
            <GachaDrawingOverlay drawingType={drawingType} drawCount={drawCount} />
          ) : null}
        </div>
      </div>
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
