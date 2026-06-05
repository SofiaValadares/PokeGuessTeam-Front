import { useCallback, useEffect, useState } from 'react';
import { drawPokemon } from '../../api/pokemonApi';
import { getProfileCollection } from '../../api/profileApi';
import { ApiError } from '../../api/http';
import type { PokeballDrawResponse } from '../../api/types/game';
import type { ProfilePokeballPayload } from '../../api/types/profile';
import { PokemonSprite } from '../../components/PokemonSprite';
import { GACHA_POKEBALLS, normalizePokeballType, type PokeballTypeId } from '../../lib/pokeballSprites';
import { pokemonRarityLabel } from '../../lib/pokemonLabels';
import { Card, InlineAlert, PageShell } from '../../ds';
import styles from './wild-area.module.css';

export default function WildAreaPage() {
  const [collection, setCollection] = useState<ProfilePokeballPayload | null>(null);
  const [lastDraw, setLastDraw] = useState<PokeballDrawResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawingType, setDrawingType] = useState<PokeballTypeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getProfileCollection();
      setCollection(c.pokeballs);
    } catch {
      setCollection(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCollection();
  }, [loadCollection]);

  const qty = (type: PokeballTypeId) => {
    const item = collection?.items.find((i) => normalizePokeballType(i.pokeballType) === type);
    return item?.quantity ?? 0;
  };

  const draw = async (ballType: PokeballTypeId) => {
    if (qty(ballType) < 1 || drawingType != null) return;
    setDrawingType(ballType);
    setError(null);
    setLastDraw(null);
    try {
      const res = await drawPokemon(ballType);
      setLastDraw(res);
      await loadCollection();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível capturar.');
    } finally {
      setDrawingType(null);
    }
  };

  return (
    <PageShell width="wide" className={styles.pageShell}>
      <Card padding="md" className={styles.card}>
        <h1 className="ds-h1">Área selvagem</h1>
        <p className={styles.intro}>
          Usa uma Pokébola do teu inventário para tentar capturar um Pokémon selvagem. Cada tipo de bola altera as
          hipóteses de raridade.
        </p>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        {loading ? (
          <p className="ds-body-muted">A carregar inventário…</p>
        ) : (
          <>
            {collection ? (
              <p className={styles.fragments}>
                Fragmentos de Poké Bola: {collection.pokeballFragments} / {collection.fragmentsPerPokeBall}
              </p>
            ) : null}

            <div className={styles.ballGrid} role="group" aria-label="Captura com Pokébolas">
              {GACHA_POKEBALLS.map(({ type, spriteSrc, label }) => {
                const count = qty(type);
                const disabled = count < 1;
                const busy = drawingType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    className={[styles.ballBtn, busy ? styles.ballBtnBusy : ''].filter(Boolean).join(' ')}
                    disabled={disabled || drawingType != null}
                    aria-label={`${label}, ${count} disponível${count === 1 ? '' : 'is'}`}
                    onClick={() => void draw(type)}
                  >
                    <span
                      className={[styles.ballQty, count < 1 ? styles.ballQtyEmpty : ''].filter(Boolean).join(' ')}
                      aria-hidden
                    >
                      {count}
                    </span>
                    <img className={styles.ballSprite} src={spriteSrc} alt="" width={72} height={72} />
                    <span className={styles.ballLabel}>{label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {lastDraw ? (
          <div className={styles.resultPanel} role="status">
            <PokemonSprite dex={lastDraw.pokemon.number} name={lastDraw.pokemon.name} size={96} animated />
            <h2 className={styles.resultTitle}>{lastDraw.pokemon.name}</h2>
            <p className={styles.resultMeta}>
              Raridade sorteada: {pokemonRarityLabel(lastDraw.rolledRarity)} ·{' '}
              {lastDraw.newInventoryLine
                ? 'Nova linha no PC'
                : `Obtido ${lastDraw.timesObtainedOnLine}× nesta linha`}
            </p>
          </div>
        ) : null}
      </Card>
    </PageShell>
  );
}
