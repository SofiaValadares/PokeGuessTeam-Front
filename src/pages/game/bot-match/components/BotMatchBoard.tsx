import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useRegisteredPokedexPokemon } from '../../../../hooks/useRegisteredPokedexPokemon';

type BotMatchBoardProps = Omit<MatchBoardProps, 'searchablePokemon'>;

export function BotMatchBoard(props: BotMatchBoardProps) {
  const { availablePokemon } = useRegisteredPokedexPokemon();

  return <MatchBoard {...props} searchablePokemon={availablePokemon} />;
}
