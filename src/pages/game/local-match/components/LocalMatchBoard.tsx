import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useNationalDexPokemon } from '../../../../hooks/useNationalDexPokemon';

type LocalMatchBoardProps = Omit<MatchBoardProps, 'searchablePokemon'>;

export function LocalMatchBoard(props: LocalMatchBoardProps) {
  const { availablePokemon } = useNationalDexPokemon();

  return <MatchBoard {...props} searchablePokemon={availablePokemon} />;
}
