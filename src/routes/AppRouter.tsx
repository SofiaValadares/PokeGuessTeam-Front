import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import AparienciaPage from '../pages/aparencia/aparencia';
import ConfiguracoesLayout from '../pages/configuracoes/ConfiguracoesLayout';
import HomePage from '../pages/home/home';
import LoginPage from '../pages/login/login';
import PcPage from '../pages/pc/pc';
import PerfilPage from '../pages/perfil/perfil';
import PokedexPage from '../pages/pokedex/pokedex';
import WildAreaPage from '../pages/wild-area/wild-area';
import BotMatchPage from '../pages/jogo/bot-match';
import LocalMatchPage from '../pages/jogo/local-match';
import FriendMatchPage from '../pages/jogo/friend-match';
import HistoricoPage from '../pages/jogo/historico';
import ForgotPasswordPage from '../pages/forgot-password/forgot-password';
import RegisterPage from '../pages/register/register';
import ResetPasswordPage from '../pages/reset-password/reset-password';
import VerifyEmailPage from '../pages/verify-email/verify-email';
import { ProtectedRoute } from './guards';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="pc" element={<PcPage />} />
          <Route path="area-selvagem" element={<WildAreaPage />} />
          <Route path="wild-area" element={<Navigate to="/area-selvagem" replace />} />
          <Route path="wild-area/gacha" element={<Navigate to="/area-selvagem" replace />} />
          <Route path="jogo" element={<Navigate to="/" replace />} />
          <Route path="jogo/bot" element={<BotMatchPage />} />
          <Route path="jogo/local" element={<LocalMatchPage />} />
          <Route path="jogo/amigo" element={<FriendMatchPage />} />
          <Route path="jogo/historico" element={<HistoricoPage />} />
          <Route path="pokedex" element={<PokedexPage />} />
          <Route path="configuracoes" element={<ConfiguracoesLayout />}>
            <Route index element={<Navigate to="perfil" replace />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="aparencia" element={<AparienciaPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
