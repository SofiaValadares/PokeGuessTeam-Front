import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import AppearancePage from '../pages/config/appearance/appearance';
import ConfigurationsLayout from '../pages/config/configurations/ConfigurationsLayout';
import HomePage from '../pages/home/home';
import LoginPage from '../pages/auth/login/login';
import PcPage from '../pages/inventory/pc/pc';
import ProfilePage from '../pages/config/profile/profile';
import PokedexPage from '../pages/inventory/pokedex/pokedex';
import WildAreaPage from '../pages/inventory/wild-area/wild-area';
import BotMatchPage from '../pages/game/bot-match/bot-match';
import LocalMatchPage from '../pages/game/local-match/local-match';
import FriendMatchPage from '../pages/game/friend-match/friend-match';
import HistoricoPage from '../pages/game/historico/historico';
import ForgotPasswordPage from '../pages/auth/forgot-password/forgot-password';
import RegisterPage from '../pages/auth/register/register';
import ResetPasswordPage from '../pages/auth/reset-password/reset-password';
import VerifyEmailPage from '../pages/auth/verify-email/verify-email';
import { ProtectedRoute } from './guards';

export function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
          <Route path="wild-area" element={<WildAreaPage />} />
          <Route path="area-selvagem" element={<Navigate to="/wild-area" replace />} />
          <Route path="wild-area/gacha" element={<Navigate to="/wild-area" replace />} />
          <Route path="game/bot" element={<BotMatchPage />} />
          <Route path="game/local" element={<LocalMatchPage />} />
          <Route path="game/amigo" element={<FriendMatchPage />} />
          <Route path="game/historico" element={<HistoricoPage />} />
          <Route path="game" element={<Navigate to="/" replace />} />
          <Route path="jogo" element={<Navigate to="/" replace />} />
          <Route path="jogo/bot" element={<Navigate to="/game/bot" replace />} />
          <Route path="jogo/local" element={<Navigate to="/game/local" replace />} />
          <Route path="jogo/amigo" element={<Navigate to="/game/amigo" replace />} />
          <Route path="jogo/historico" element={<Navigate to="/game/historico" replace />} />
          <Route path="pokedex" element={<PokedexPage />} />
          <Route path="config" element={<ConfigurationsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="appearance" element={<AppearancePage />} />
          </Route>
          <Route path="configuracoes/*" element={<Navigate to="/config/profile" replace />} />
          <Route path="configuracoes" element={<Navigate to="/config/profile" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
