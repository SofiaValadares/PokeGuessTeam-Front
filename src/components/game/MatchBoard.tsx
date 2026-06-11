import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OpponentKnowledgeSlotDto } from '../../api/types/game';
import { searchPokemon } from '../../api/pokemonApi';
import type { PokemonDto } from '../../api/types/pokemon';
import { PokemonSprite } from '../PokemonSprite';
import { Button } from '../../ds';
import { OpponentClueCard } from './OpponentClueCard';
import { PokemonSearchField } from './PokemonSearchField';
import { searchRegisteredPokemonList, listRegisteredPokemon } from '../../lib/pokemon/registeredPokedexSearch';
import styles from './game.module.css';

export type MatchBoardProps = {
  playerName: string;
  opponentName: string;
  userScore: number;
  opponentScore: number;
  maxScore?: number;
  isYourTurn: boolean;
  status: 'ACTIVE' | 'FINISHED';
  opponentKnowledge: OpponentKnowledgeSlotDto[];
  myTeam?: number[];
  opponentHitsOnMyTeam?: number[];
  onGuess: (pokedexNumber: number) => Promise<void>;
  onSurrender: () => void;
  busy?: boolean;
  guessLoading?: boolean;
  finishedMessage?: string | null;
  playerAvatarDex?: number | null;
  opponentAvatarDex?: number | null;
  excludedPokedexNumbers?: number[];
  playerTheme?: 'default' | 'guest' | 'waiting';
  /** When set, search is limited to these Pokémon (e.g. registered Pokédex). */
  registeredPokedexOnly?: PokemonDto[];
  /** Conteúdo extra abaixo do botão de desistir (ex.: atualizar partida online). */
  actionsBelowSurrender?: ReactNode;
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
  myTeam,
  opponentHitsOnMyTeam,
  onGuess,
  onSurrender,
  busy = false,
  guessLoading = false,
  finishedMessage,
  playerAvatarDex,
  opponentAvatarDex,
  excludedPokedexNumbers = [],
  playerTheme = 'default',
  registeredPokedexOnly,
  actionsBelowSurrender,
}: MatchBoardProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PokemonDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const excludedDex = useMemo(() => new Set(excludedPokedexNumbers), [excludedPokedexNumbers]);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 1) return;
      try {
        if (registeredPokedexOnly) {
          setResults(searchRegisteredPokemonList(registeredPokedexOnly, q, 50));
          return;
        }
        setResults(await searchPokemon(q, 20));
      } catch {
        setResults([]);
      }
    },
    [registeredPokedexOnly],
  );

  const handleSearchOpen = useCallback(() => {
    if (registeredPokedexOnly && registeredPokedexOnly.length > 0) {
      setResults(listRegisteredPokemon(registeredPokedexOnly));
      return;
    }
    if (query.trim()) {
      void search(query);
    }
  }, [query, registeredPokedexOnly, search]);

  const handleSearchClose = useCallback(() => {
    setResults([]);
  }, []);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }
    const t = window.setTimeout(() => void search(query), 220);
    return () => window.clearTimeout(t);
  }, [query, search]);

  const sending = submitting || guessLoading;
  const canGuess = status === 'ACTIVE' && isYourTurn && !busy && !sending;

  const submitGuess = async (pokemon: PokemonDto) => {
    if (!canGuess || excludedDex.has(pokemon.number) || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onGuess(pokemon.number);
      setQuery('');
      setResults([]);
    } catch {
      /* erro mostrado pelo provider */
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const revealedCount = opponentKnowledge.filter((s) => s.revealed).length;
  const opponentHitSet = useMemo(
    () => new Set(opponentHitsOnMyTeam ?? []),
    [opponentHitsOnMyTeam],
  );
  const myTeamSlots = myTeam?.length ? myTeam : Array.from({ length: maxScore }, () => null);

  return (
    <div
      className={[
        styles.matchShell,
        playerTheme === 'guest' ? styles.matchShellGuest : '',
        playerTheme === 'waiting' ? styles.matchShellWaiting : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.matchShellHeader}>
        <span className={styles.matchShellTitle}>PokéTeamGuess · Partida</span>
      </header>

      <div className={styles.matchLayout}>
        <section className={styles.matchLeft} aria-label="Campos de palpite">
          <div className={styles.matchLeftHead}>
            <h2 className={styles.matchPanelTitle}>Campos de palpite</h2>
            <p className={styles.matchPanelSub}>
              Pistas reais por slot do adversário · {revealedCount}/{maxScore} revelados
            </p>
          </div>

          <div className={styles.clueList}>
            {opponentKnowledge.map((slot) => (
              <OpponentClueCard key={slot.slot} slot={slot} />
            ))}
          </div>

          {status === 'ACTIVE' ? (
            <div className={styles.matchGuessBar}>
              <PokemonSearchField
                query={query}
                onQueryChange={handleQueryChange}
                results={results}
                selected={null}
                onSelect={(p) => void submitGuess(p)}
                disabled={!canGuess && !sending}
                loading={sending}
                excludedDexNumbers={excludedDex}
                placeholder={
                  registeredPokedexOnly
                    ? 'Clica para ver a Pokédex ou pesquisa por nome'
                    : 'Pesquisa um Pokémon e clica ou carrega Enter'
                }
                overlay
                showResultsOnFocus={Boolean(registeredPokedexOnly)}
                onOpen={handleSearchOpen}
                onClose={handleSearchClose}
              />
            </div>
          ) : (
            <p className={styles.matchFinishedBanner}>{finishedMessage ?? 'Partida terminada.'}</p>
          )}
        </section>

        <aside className={styles.matchRight} aria-label="Controlo de turnos">
          <h2 className={styles.matchPanelTitle}>Controlo de turnos</h2>

          {status === 'ACTIVE' ? (
            <p
              className={[
                styles.turnBanner,
                isYourTurn ? styles.turnBannerActive : styles.turnBannerWait,
              ].join(' ')}
            >
              {isYourTurn
                ? 'A tua vez — escolhe um Pokémon na pesquisa.'
                : `À espera de ${opponentName}.`}
            </p>
          ) : null}

          <div className={styles.matchPlayers}>
            <div
              className={[
                styles.matchPlayerCard,
                isYourTurn && status === 'ACTIVE' ? styles.matchPlayerCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={styles.matchPlayerAvatar}>
                {playerAvatarDex != null ? (
                  <PokemonSprite dex={playerAvatarDex} name={playerName} size={48} />
                ) : (
                  <span className={styles.clueUnknownSprite}>?</span>
                )}
              </div>
              <span className={styles.matchPlayerName}>{playerName}</span>
              <span className={styles.matchPlayerScore}>
                {userScore}/{maxScore}
              </span>
            </div>
            <div
              className={[
                styles.matchPlayerCard,
                !isYourTurn && status === 'ACTIVE' ? styles.matchPlayerCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={styles.matchPlayerAvatar}>
                {opponentAvatarDex != null ? (
                  <PokemonSprite dex={opponentAvatarDex} name={opponentName} size={48} />
                ) : (
                  <span className={styles.clueUnknownSprite}>?</span>
                )}
              </div>
              <span className={styles.matchPlayerName}>{opponentName}</span>
              <span className={styles.matchPlayerScore}>
                {opponentScore}/{maxScore}
              </span>
            </div>
          </div>

          <section className={styles.matchHitsSection}>
            <h3 className={styles.matchHitsTitle}>Encontrados pelo adversário</h3>
            <p className={styles.matchHitsSub}>Na tua equipe · {opponentName}</p>
            <ul className={styles.matchHitsGrid}>
              {myTeamSlots.map((dex, index) => (
                <li key={`${index}-${dex ?? 'empty'}`} className={styles.matchHitCell}>
                  {dex != null && opponentHitSet.has(dex) ? (
                    <PokemonSprite
                      dex={dex}
                      name={`#${dex}`}
                      size={64}
                    />
                  ) : (
                    <span className={styles.matchHitUnknown}>???</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {status === 'ACTIVE' ? (
            <div className={styles.matchActionsFooter}>
              <Button
                type="button"
                variant="ghost"
                size="md"
                className={styles.matchSurrenderBtn}
                disabled={busy || submitting}
                onClick={onSurrender}
              >
                DESISTIR
              </Button>
              {actionsBelowSurrender}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
