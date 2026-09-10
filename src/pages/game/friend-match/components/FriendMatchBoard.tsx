import { useMemo } from 'react';
import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useFriendMatch } from '../providers/FriendMatchProvider';
import { useNationalDexPokemon } from '../../../../hooks/useNationalDexPokemon';

type FriendMatchBoardProps = Omit<MatchBoardProps, 'searchablePokemon'>;

export function FriendMatchBoard(props: FriendMatchBoardProps) {
  const { match } = useFriendMatch();
  const { availablePokemon } = useNationalDexPokemon();

  const searchablePokemon = useMemo(() => {
    if (!match?.eventMode || !match.eventPokedexNumbers?.length) return availablePokemon;
    const allow = new Set(match.eventPokedexNumbers);
    return availablePokemon.filter((p) => allow.has(p.number));
  }, [availablePokemon, match?.eventMode, match?.eventPokedexNumbers]);

  return <MatchBoard {...props} searchablePokemon={searchablePokemon} />;
}
