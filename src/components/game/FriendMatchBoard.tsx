import { MatchBoard, type MatchBoardProps } from './MatchBoard';
import { useFriendMatchDex } from '../../pages/game/friend-match/providers/FriendMatchDexProvider';
import { readAllPokemonFromCache } from '../../store/slices/cache/queries';
import { useAppSelector } from '../../store/hooks';
import { selectBotMatch } from '../../pages/game/bot-match/slice/botMatchSelectors';

type FriendMatchBoardProps = Omit<MatchBoardProps, 'registeredPokedexOnly'>;

export function FriendMatchBoard(props: FriendMatchBoardProps) {
  const { dexReady } = useFriendMatchDex();
  const { allPokemon } = useAppSelector(selectBotMatch);
  const registeredPokemon =
    allPokemon.length > 0 ? allPokemon : dexReady ? readAllPokemonFromCache() : [];

  return <MatchBoard {...props} registeredPokedexOnly={registeredPokemon} />;
}
