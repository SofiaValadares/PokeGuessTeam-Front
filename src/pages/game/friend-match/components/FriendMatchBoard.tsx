import { useMemo } from 'react';
import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useFriendMatchDex } from '../providers/FriendMatchDexProvider';
import { useFriendMatch } from '../providers/FriendMatchProvider';
import { readAllPokemonFromCache } from '../../../../store/slices/cache/queries';
import { useAppSelector } from '../../../../store/hooks';
import { selectMatchDex } from '../../shared/slice/matchDexSelectors';

type FriendMatchBoardProps = Omit<MatchBoardProps, 'registeredPokedexOnly'>;

export function FriendMatchBoard(props: FriendMatchBoardProps) {
  const { dexReady } = useFriendMatchDex();
  const { match } = useFriendMatch();
  const { allPokemon } = useAppSelector(selectMatchDex);
  const pool =
    allPokemon.length > 0 ? allPokemon : dexReady ? readAllPokemonFromCache() : [];

  const registeredPokemon = useMemo(() => {
    if (!match?.eventMode || !match.eventPokedexNumbers?.length) return pool;
    const allow = new Set(match.eventPokedexNumbers);
    return pool.filter((p) => allow.has(p.number));
  }, [match?.eventMode, match?.eventPokedexNumbers, pool]);

  return (
    <MatchBoard
      {...props}
      registeredPokedexOnly={registeredPokemon.length > 0 ? registeredPokemon : undefined}
    />
  );
}
