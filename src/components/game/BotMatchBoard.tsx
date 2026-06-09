import { MatchBoard, type MatchBoardProps } from './MatchBoard';
import { useBotMatchPlay } from '../../pages/game/bot-match/providers/BotMatchPlayProvider';

type BotMatchBoardProps = Omit<MatchBoardProps, 'registeredPokedexOnly'>;

export function BotMatchBoard(props: BotMatchBoardProps) {
  const { registeredPokemon } = useBotMatchPlay();

  return <MatchBoard {...props} registeredPokedexOnly={registeredPokemon} />;
}
