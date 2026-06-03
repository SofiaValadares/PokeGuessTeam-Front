import { useCallback, useEffect, useState } from 'react';
import type { BotMatchGuessFeedbackDto, OpponentKnowledgeSlotDto } from '../../api/types/game';
import { searchPokemon } from '../../api/pokemonApi';
import type { PokemonDto } from '../../api/types/pokemon';
import { pokemonColorLabel, pokemonTypeLabel } from '../../lib/pokemonLabels';
import { PokemonSprite } from '../PokemonSprite';
import { Button } from '../../ds';
import { GuessLogTable } from './GuessLogTable';
import styles from './game.module.css';

type MatchBoardProps = {
  playerName: string;
  opponentName: string;
  userScore: number;
  opponentScore: number;
  maxScore?: number;
  isYourTurn: boolean;
  status: 'ACTIVE' | 'FINISHED';
  opponentKnowledge: OpponentKnowledgeSlotDto[];
  guessLog: BotMatchGuessFeedbackDto[];
  onGuess: (pokedexNumber: number) => Promise<void>;
  onSurrender: () => void;
  busy?: boolean;
  localLabels?: boolean;
  finishedMessage?: string | null;
};

export function MatchBoard({
  playerName,
  opponentName,
  userScore,
  opponentScore,
  maxScore = 6,
  isYourTurn,
  status,
  opponentKnowledge,
  guessLog,
  onGuess,
  onSurrender,
  busy = false,
  localLabels = false,
  finishedMessage,
}: MatchBoardProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PokemonDto[]>([]);
  const [selected, setSelected] = useState<PokemonDto | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      setResults(await searchPokemon(q, 15));
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void search(query), 280);
    return () => window.clearTimeout(t);
  }, [query, search]);

  const canGuess = status === 'ACTIVE' && isYourTurn && !busy;

  const submitGuess = async () => {
    if (!selected || !canGuess) return;
    await onGuess(selected.number);
    setQuery('');
    setResults([]);
    setSelected(null);
  };

  return (
    <div className={styles.matchBoard}>
      <div
        className={[
          styles.scoreboard,
          isYourTurn && status === 'ACTIVE' ? styles.scoreboardYourTurn : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.scoreCol}>
          <span className={styles.scoreName}>{playerName}</span>
          <span className={styles.scoreValue}>
            {userScore}/{maxScore}
          </span>
        </div>
        <span className={styles.scoreVs}>vs</span>
        <div className={styles.scoreCol}>
          <span className={styles.scoreName}>{opponentName}</span>
          <span className={styles.scoreValue}>
            {opponentScore}/{maxScore}
          </span>
        </div>
      </div>

      {status === 'ACTIVE' ? (
        <p className={[styles.turnBanner, isYourTurn ? styles.turnBannerActive : styles.turnBannerWait]
          .join(' ')}>
          {isYourTurn ? 'É a tua vez — confirma um palpite.' : `Aguarda a vez de ${opponentName}.`}
        </p>
      ) : (
        <p className={styles.turnBanner}>{finishedMessage ?? 'Partida terminada.'}</p>
      )}

      <section className={styles.knowledgeSection} aria-label="Pistas sobre o adversário">
        <h3 className={styles.sectionTitle}>Equipa adversária (pistas)</h3>
        <ol className={styles.knowledgeGrid}>
          {opponentKnowledge.map((slot, index) => (
            <li
              key={index}
              className={slot.revealed ? styles.knowledgeSlotRevealed : styles.knowledgeSlotHidden}
            >
              {slot.revealed && slot.pokedexNumber != null ? (
                <>
                  <PokemonSprite dex={slot.pokedexNumber} name={`#${slot.pokedexNumber}`} size={40} />
                  <ul className={styles.knowledgeMeta}>
                    {slot.primaryType ? <li>{pokemonTypeLabel(slot.primaryType)}</li> : null}
                    {slot.secondaryType && slot.secondaryType !== 'NONE' ? (
                      <li>{pokemonTypeLabel(slot.secondaryType)}</li>
                    ) : null}
                    {slot.generation ? <li>Gen {slot.generation}</li> : null}
                    {slot.color ? <li>{pokemonColorLabel(slot.color)}</li> : null}
                    {slot.heightM ? <li>{slot.heightM} m</li> : null}
                    {slot.weightKg ? <li>{slot.weightKg} kg</li> : null}
                  </ul>
                </>
              ) : (
                <span className={styles.knowledgeHidden}>?</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {status === 'ACTIVE' ? (
        <section className={styles.guessSection}>
          <h3 className={styles.sectionTitle}>Palpite</h3>
          <input
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="Pesquisar Pokémon…"
            disabled={!canGuess}
          />
          {results.length > 0 ? (
            <ul className={styles.searchResults}>
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={[
                      styles.searchResultBtn,
                      selected?.id === p.id ? styles.searchResultSelected : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelected(p)}
                    disabled={!canGuess}
                  >
                    {p.name} (#{p.number})
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className={styles.guessActions}>
            <Button type="button" variant="primary" size="md" disabled={!selected || !canGuess} onClick={() => void submitGuess()}>
              {busy ? 'A processar…' : 'Confirmar palpite'}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onSurrender}>
              Desistir
            </Button>
          </div>
        </section>
      ) : null}

      <section>
        <h3 className={styles.sectionTitle}>Histórico de palpites</h3>
        <GuessLogTable rows={guessLog} localLabels={localLabels} />
      </section>
    </div>
  );
}
