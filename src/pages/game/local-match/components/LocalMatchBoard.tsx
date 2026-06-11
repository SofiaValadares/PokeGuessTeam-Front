import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useLocalMatchPlay } from '../providers/LocalMatchPlayProvider';

type LocalMatchBoardProps = Omit<MatchBoardProps, 'registeredPokedexOnly'>;

export function LocalMatchBoard(props: LocalMatchBoardProps) {
  const { registeredPokemon } = useLocalMatchPlay();

  return <MatchBoard {...props} registeredPokedexOnly={registeredPokemon} />;
}
