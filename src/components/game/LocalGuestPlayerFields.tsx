import { useEffect, useMemo, useState } from 'react';
import { useRegisteredPokedexPokemon } from '../../hooks/useRegisteredPokedexPokemon';
import { PokemonSprite } from '../PokemonSprite';
import { TextField } from '../../ds';
import { PokemonSearchField } from './PokemonSearchField';
import styles from './game.module.css';

type LocalGuestPlayerFieldsProps = {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  favoriteDex: number | null;
  favoriteName: string | null;
  onFavoriteChange: (dex: number, name: string) => void;
  disabled?: boolean;
};

export function LocalGuestPlayerFields({
  playerName,
  onPlayerNameChange,
  favoriteDex,
  favoriteName,
  onFavoriteChange,
  disabled = false,
}: LocalGuestPlayerFieldsProps) {
  const { availablePokemon, loading } = useRegisteredPokedexPokemon();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return availablePokemon
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.number).includes(q) ||
          `#${p.number}`.includes(q),
      )
      .slice(0, 12);
  }, [availablePokemon, debouncedQuery]);

  const selectedFavorite = useMemo(
    () =>
      favoriteDex != null
        ? availablePokemon.find((p) => p.number === favoriteDex) ?? null
        : null,
    [availablePokemon, favoriteDex],
  );

  return (
    <div className={styles.localGuestFields}>
      <TextField
        label="Nome do jogador"
        value={playerName}
        onChange={(e) => onPlayerNameChange(e.target.value)}
        disabled={disabled}
        maxLength={40}
      />
      <div className={styles.localGuestFavorite}>
        <span className={styles.localGuestFavoriteLabel}>Pokémon favorito</span>
        {favoriteDex != null && favoriteName ? (
          <div className={styles.localGuestFavoriteCurrent}>
            <PokemonSprite dex={favoriteDex} name={favoriteName} size={48} />
            <span>
              {favoriteName} <span className={styles.searchDex}>#{favoriteDex}</span>
            </span>
          </div>
        ) : (
          <p className={styles.searchMeta}>Escolhe um Pokémon registado na Pokédex.</p>
        )}
        <PokemonSearchField
          query={query}
          onQueryChange={setQuery}
          results={results}
          selected={selectedFavorite}
          onSelect={(p) => onFavoriteChange(p.number, p.name)}
          disabled={disabled || loading}
          placeholder="Pesquisar favorito…"
          overlay
        />
      </div>
    </div>
  );
}
