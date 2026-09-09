import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useNationalDexPokemon } from '../../../../hooks/useNationalDexPokemon';

type BotMatchBoardProps = Omit<MatchBoardProps, 'searchablePokemon'>;

export function BotMatchBoard(props: BotMatchBoardProps) {
  const { availablePokemon } = useNationalDexPokemon();

  return <MatchBoard {...props} searchablePokemon={availablePokemon} />;
}
