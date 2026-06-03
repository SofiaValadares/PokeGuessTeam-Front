import { Navigate } from 'react-router-dom';

/** Wild Area redireciona para o hub de duelos (GDD: exploração + gacha). */
export default function WildAreaPage() {
  return <Navigate to="/jogo" replace />;
}
