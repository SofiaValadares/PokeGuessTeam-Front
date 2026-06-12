import { MatchBoard, type MatchBoardProps } from '../../shared/components/MatchBoard';

/** Partida online: pesquisa na Pokédex nacional (sem filtro de registados). */
export function FriendMatchBoard(props: MatchBoardProps) {
  return <MatchBoard {...props} />;
}
