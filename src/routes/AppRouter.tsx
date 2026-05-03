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
import RegisterPage from '../pages/register/register';
import { ProtectedRoute } from './guards';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
