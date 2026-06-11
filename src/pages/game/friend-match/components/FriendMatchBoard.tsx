import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useFriendMatchDex } from '../providers/FriendMatchDexProvider';
import { readAllPokemonFromCache } from '../../../../store/slices/cache/queries';
import { useAppSelector } from '../../../../store/hooks';
import { selectMatchDex } from '../../shared/slice/matchDexSelectors';

type FriendMatchBoardProps = Omit<MatchBoardProps, 'registeredPokedexOnly'>;

export function FriendMatchBoard(props: FriendMatchBoardProps) {
  const { dexReady } = useFriendMatchDex();
  const { allPokemon } = useAppSelector(selectMatchDex);
  const registeredPokemon =
    allPokemon.length > 0 ? allPokemon : dexReady ? readAllPokemonFromCache() : [];

  return (
    <MatchBoard
      {...props}
      registeredPokedexOnly={registeredPokemon.length > 0 ? registeredPokemon : undefined}
    />
  );
}
