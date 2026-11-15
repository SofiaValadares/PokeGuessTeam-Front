import { useMemo, useState } from 'react';
import type { Pokemon } from '../../model';
import { PokemonSprite } from '../../components/PokemonSprite';
import { Button, TextField } from '../../ds';
import { pokemonTypeLabel } from '../../lib/pokemon/labels';
import styles from './admin.module.css';

type AdminEventPokemonPickerProps = {
  allPokemon: Pokemon[];
  selectedNumbers: number[];
  onChange: (numbers: number[]) => void;
  disabled?: boolean;
};

type ColumnFilters = {
  query: string;
  type: string;
  generation: string;
};

const emptyFilters: ColumnFilters = {
  query: '',
  type: '',
  generation: '',
};

function matchesQuery(pokemon: Pokemon, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    pokemon.name.toLowerCase().includes(q) ||
    String(pokemon.number).includes(q) ||
    `#${pokemon.number}`.includes(q)
  );
}

function matchesFilters(pokemon: Pokemon, filters: ColumnFilters): boolean {
  if (!matchesQuery(pokemon, filters.query)) return false;
  if (filters.type) {
    const type = filters.type.toUpperCase();
    const primary = pokemon.primaryType?.toUpperCase() ?? '';
    const secondary = pokemon.secondaryType?.toUpperCase() ?? '';
    if (primary !== type && secondary !== type) return false;
  }
  if (filters.generation) {
    if (String(pokemon.generation ?? '') !== filters.generation) return false;
  }
  return true;
}

function sortByNumber(list: Pokemon[]): Pokemon[] {
  return [...list].sort((a, b) => a.number - b.number);
}

function hasActiveFilters(filters: ColumnFilters): boolean {
  return Boolean(filters.query.trim() || filters.type || filters.generation);
}

export function AdminEventPokemonPicker({
  allPokemon,
  selectedNumbers,
  onChange,
  disabled = false,
}: AdminEventPokemonPickerProps) {
  const [availableFilters, setAvailableFilters] = useState<ColumnFilters>(emptyFilters);
  const [selectedFilters, setSelectedFilters] = useState<ColumnFilters>(emptyFilters);

  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of allPokemon) {
      if (p.primaryType) set.add(p.primaryType.toUpperCase());
      if (p.secondaryType && p.secondaryType.toUpperCase() !== 'NONE') {
        set.add(p.secondaryType.toUpperCase());
      }
    }
    return Array.from(set).sort((a, b) => pokemonTypeLabel(a).localeCompare(pokemonTypeLabel(b), 'pt'));
  }, [allPokemon]);

  const generationOptions = useMemo(() => {
    const set = new Set<number>();
    for (const p of allPokemon) {
      if (p.generation != null) set.add(p.generation);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [allPokemon]);

  const byNumber = useMemo(() => {
    const map = new Map<number, Pokemon>();
    for (const p of allPokemon) map.set(p.number, p);
    return map;
  }, [allPokemon]);

  const availableFiltered = useMemo(
    () =>
      sortByNumber(
        allPokemon.filter((p) => !selectedSet.has(p.number) && matchesFilters(p, availableFilters)),
      ),
    [allPokemon, availableFilters, selectedSet],
  );

  const selectedFiltered = useMemo(() => {
    const list = selectedNumbers
      .map((n) => byNumber.get(n))
      .filter((p): p is Pokemon => p != null)
      .filter((p) => matchesFilters(p, selectedFilters));
    return sortByNumber(list);
  }, [byNumber, selectedFilters, selectedNumbers]);

  const add = (number: number) => {
    if (disabled || selectedSet.has(number)) return;
    onChange([...selectedNumbers, number]);
  };

  const remove = (number: number) => {
    if (disabled) return;
    onChange(selectedNumbers.filter((n) => n !== number));
  };

  const selectAllFiltered = () => {
    if (disabled || availableFiltered.length === 0) return;
    const next = new Set(selectedNumbers);
    for (const p of availableFiltered) next.add(p.number);
    onChange(Array.from(next));
  };

  const removeAllFiltered = () => {
    if (disabled || selectedFiltered.length === 0) return;
    const removeSet = new Set(selectedFiltered.map((p) => p.number));
    onChange(selectedNumbers.filter((n) => !removeSet.has(n)));
  };

  return (
    <div className={styles.pickerGrid}>
      <PokemonColumn
        title="Disponíveis"
        filters={availableFilters}
        onFiltersChange={setAvailableFilters}
        searchName="availablePokemonSearch"
        searchPlaceholder="Pesquisar para adicionar…"
        typeOptions={typeOptions}
        generationOptions={generationOptions}
        pokemon={availableFiltered}
        emptyLabel={
          hasActiveFilters(availableFilters)
            ? 'Nenhum Pokémon corresponde aos filtros.'
            : selectedNumbers.length > 0
              ? 'Todos os Pokémon já foram selecionados.'
              : 'Nenhum Pokémon disponível.'
        }
        onRowClick={add}
        actionLabel="Adicionar"
        bulkLabel={`Selecionar todos (${availableFiltered.length})`}
        onBulk={selectAllFiltered}
        bulkDisabled={disabled || availableFiltered.length === 0}
        disabled={disabled}
      />
      <PokemonColumn
        title={`Selecionados (${selectedNumbers.length})`}
        filters={selectedFilters}
        onFiltersChange={setSelectedFilters}
        searchName="selectedPokemonSearch"
        searchPlaceholder="Pesquisar selecionados…"
        typeOptions={typeOptions}
        generationOptions={generationOptions}
        pokemon={selectedFiltered}
        emptyLabel={
          hasActiveFilters(selectedFilters)
            ? 'Nenhum selecionado corresponde aos filtros.'
            : 'Ainda não selecionaste Pokémon.'
        }
        onRowClick={remove}
        actionLabel="Remover"
        bulkLabel={`Remover filtrados (${selectedFiltered.length})`}
        onBulk={removeAllFiltered}
        bulkDisabled={disabled || selectedFiltered.length === 0}
        disabled={disabled}
      />
    </div>
  );
}

type PokemonColumnProps = {
  title: string;
  filters: ColumnFilters;
  onFiltersChange: (filters: ColumnFilters) => void;
  searchName: string;
  searchPlaceholder: string;
  typeOptions: string[];
  generationOptions: number[];
  pokemon: Pokemon[];
  emptyLabel: string;
  onRowClick: (number: number) => void;
  actionLabel: string;
  bulkLabel: string;
  onBulk: () => void;
  bulkDisabled: boolean;
  disabled: boolean;
};

function PokemonColumn({
  title,
  filters,
  onFiltersChange,
  searchName,
  searchPlaceholder,
  typeOptions,
  generationOptions,
  pokemon,
  emptyLabel,
  onRowClick,
  actionLabel,
  bulkLabel,
  onBulk,
  bulkDisabled,
  disabled,
}: PokemonColumnProps) {
  return (
    <section className={styles.pickerColumn} aria-label={title}>
      <h3 className={styles.pickerColumnTitle}>{title}</h3>
      <TextField
        label="Pesquisar"
        name={searchName}
        value={filters.query}
        onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
        placeholder={searchPlaceholder}
        disabled={disabled}
      />
      <div className={styles.pickerFilters}>
        <label className={styles.pickerSelectLabel}>
          Tipo
          <select
            className={styles.pickerSelect}
            value={filters.type}
            disabled={disabled}
            onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
          >
            <option value="">Todos</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {pokemonTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.pickerSelectLabel}>
          Geração
          <select
            className={styles.pickerSelect}
            value={filters.generation}
            disabled={disabled}
            onChange={(e) => onFiltersChange({ ...filters, generation: e.target.value })}
          >
            <option value="">Todas</option>
            {generationOptions.map((gen) => (
              <option key={gen} value={String(gen)}>
                {gen}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.pickerBulk}>
        <Button type="button" size="sm" variant="secondary" disabled={bulkDisabled} onClick={onBulk}>
          {bulkLabel}
        </Button>
      </div>
      <ul className={styles.pickerList}>
        {pokemon.length === 0 ? (
          <li className={styles.pickerEmpty}>{emptyLabel}</li>
        ) : (
          pokemon.map((p) => (
            <li key={p.number}>
              <button
                type="button"
                className={styles.pickerRow}
                disabled={disabled}
                onClick={() => onRowClick(p.number)}
                aria-label={`${actionLabel} ${p.name}`}
              >
                <PokemonSprite dex={p.number} name={p.name} size={40} />
                <span className={styles.pickerRowMeta}>
                  <span className={styles.pickerRowName}>{p.name}</span>
                  <span className={styles.pickerRowDex}>#{p.number}</span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
