import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';
import { useBotMatchPlay } from '../providers/BotMatchPlayProvider';

type BotMatchBoardProps = Omit<MatchBoardProps, 'registeredPokedexOnly'>;

export function BotMatchBoard(props: BotMatchBoardProps) {
  const { registeredPokemon } = useBotMatchPlay();

  return <MatchBoard {...props} registeredPokedexOnly={registeredPokemon} />;
}
