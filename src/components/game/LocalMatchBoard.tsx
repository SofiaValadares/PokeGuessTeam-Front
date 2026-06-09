import { MatchBoard, type MatchBoardProps } from './MatchBoard';
import { useLocalMatchPlay } from '../../pages/jogo/local-match/providers/LocalMatchPlayProvider';

type LocalMatchBoardProps = Omit<MatchBoardProps, 'registeredPokedexOnly'>;

export function LocalMatchBoard(props: LocalMatchBoardProps) {
  const { registeredPokemon } = useLocalMatchPlay();

  return <MatchBoard {...props} registeredPokedexOnly={registeredPokemon} />;
}
