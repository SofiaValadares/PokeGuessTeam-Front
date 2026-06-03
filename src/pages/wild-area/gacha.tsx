import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { drawPokemon } from '../../api/pokemonApi';
import { getProfileCollection } from '../../api/profileApi';
import type { ProfilePokeballPayload } from '../../api/types/profile';
import { ApiError } from '../../api/http';
import type { PokeballDrawResponse } from '../../api/types/game';
import { pokeballLabel } from '../../lib/pokeballLabels';
import { pokemonRarityLabel } from '../../lib/pokemonLabels';
import { PokemonSprite } from '../../components/PokemonSprite';
import { Button, Card, InlineAlert, PageShell } from '../../ds';
import gameStyles from '../../components/game/game.module.css';
import styles from './gacha.module.css';

const BALL_TYPES = ['POKE_BALL', 'GREAT_BALL', 'ULTRA_BALL', 'MASTER_BALL'] as const;

export default function GachaPage() {
  const [collection, setCollection] = useState<ProfilePokeballPayload | null>(null);
  const [selectedBall, setSelectedBall] = useState<string>('POKE_BALL');
  const [lastDraw, setLastDraw] = useState<PokeballDrawResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollection = async () => {
    setLoading(true);
    try {
      const c = await getProfileCollection();
      if (c.variant === 'pokeballs') setCollection(c.pokeballs);
      else setCollection(null);
    } catch {
      setCollection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCollection();
  }, []);

  const draw = async () => {
    setDrawing(true);
    setError(null);
    setLastDraw(null);
    try {
      const res = await drawPokemon(selectedBall);
      setLastDraw(res);
      await loadCollection();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível capturar.');
    } finally {
      setDrawing(false);
    }
  };

  const qty = (type: string) => collection?.items.find((i) => i.pokeballType === type)?.quantity ?? 0;

  return (
    <PageShell width="wide">
      <Card padding="md">
        <Link to="/jogo">← Duelos</Link>
        <h1 className="ds-h1">Gacha — Captura</h1>
        <p className="ds-body-muted">
          Gasta uma Pokébola do inventário para sortear um Pokémon (recompensas de duelos no GDD). Integração com{' '}
          <code>POST /api/pokemon/draw</code>.
        </p>

        {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

        {loading ? (
          <p className="ds-body-muted">A carregar inventário…</p>
        ) : (
          <>
            <ul className={styles.ballList}>
              {BALL_TYPES.map((type) => (
                <li key={type}>
                  <label className={styles.ballOption}>
                    <input
                      type="radio"
                      name="ball"
                      checked={selectedBall === type}
                      onChange={() => setSelectedBall(type)}
                    />
                    {pokeballLabel(type)} — {qty(type)} disponível(is)
                  </label>
                </li>
              ))}
            </ul>
            {collection ? (
              <p className="ds-body-muted">
                Fragmentos: {collection.pokeballFragments}/{collection.fragmentsPerPokeBall}
              </p>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={drawing || qty(selectedBall) < 1}
              onClick={() => void draw()}
            >
              {drawing ? 'A capturar…' : 'Capturar'}
            </Button>
          </>
        )}

        {lastDraw ? (
          <div className={gameStyles.gachaResult}>
            <PokemonSprite dex={lastDraw.pokemon.number} name={lastDraw.pokemon.name} size={96} />
            <h2 className="ds-h2" style={{ margin: 0 }}>
              {lastDraw.pokemon.name}
            </h2>
            <p>
              Raridade sorteada: {pokemonRarityLabel(lastDraw.rolledRarity)} ·{' '}
              {lastDraw.newInventoryLine ? 'Nova linha no PC' : `Obtido ${lastDraw.timesObtainedOnLine}×`}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void loadCollection()}>
              Atualizar inventário
            </Button>
          </div>
        ) : null}
      </Card>
    </PageShell>
  );
}
