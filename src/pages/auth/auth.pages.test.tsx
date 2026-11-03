import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FetchStatus } from '../../types/fetchStatus';
import LoginPage from './login/login';
import RegisterPage from './register/register';
import ForgotPasswordPage from './forgot-password/forgot-password';
import ResetPasswordPage from './reset-password/reset-password';
import VerifyEmailPage from './verify-email/verify-email';
import {
  confirmPasswordReset,
  register,
  requestPasswordReset,
  sendEmailVerificationCode,
} from '../../auth/authService';

const mockAuth = {
  sessionFetchStatus: FetchStatus.Success,
  authenticated: false,
  me: null,
  showIntroDialogue: false,
  refresh: jest.fn().mockResolvedValue(undefined),
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
  dismissIntroDialogue: jest.fn(),
};

jest.mock('../../store/providers/AuthProvider', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../auth/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  requestPasswordReset: jest.fn(),
  confirmPasswordReset: jest.fn(),
  sendEmailVerificationCode: jest.fn(),
}));

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => (action: { unwrap?: () => Promise<unknown> }) =>
    action?.unwrap ? action : { unwrap: () => Promise.resolve() },
  useAppSelector: (sel: (s: unknown) => unknown) =>
    sel({
      auth: {
        sessionFetchStatus: 'success',
        authenticated: false,
        me: null,
        showIntroDialogue: false,
      },
    }),
}));

jest.mock('../../store/slices/authSlice', () => ({
  confirmEmailUser: (payload: unknown) => ({
    type: 'auth/confirmEmail',
    payload,
    unwrap: () => Promise.resolve(),
  }),
}));

function renderAt(ui: React.ReactElement, path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path={path} element={ui} />
        <Route path="/" element={<p>home</p>} />
        <Route path="/verify-email" element={<p>verify</p>} />
        <Route path="/reset-password" element={<p>reset</p>} />
        <Route path="/login" element={<p>login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('páginas de autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.authenticated = false;
    mockAuth.sessionFetchStatus = FetchStatus.Success;
    mockAuth.login.mockResolvedValue(undefined);
  });

  it('submete o login com e-mail e senha válidos', async () => {
    renderAt(<LoginPage />, '/login');
    fireEvent.change(screen.getByLabelText(/^E-mail$/i), { target: { value: 'ash@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha$/i), { target: { value: 'Abcdefgh!1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(mockAuth.login).toHaveBeenCalledWith('ash@example.com', 'Abcdefgh!1'));
  });

  it('não envia login com formulário vazio', () => {
    renderAt(<LoginPage />, '/login');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(mockAuth.login).not.toHaveBeenCalled();
  });

  it('regista uma conta nova', async () => {
    (register as jest.Mock).mockResolvedValue({ email: 'gary@example.com' });
    renderAt(<RegisterPage />, '/register');
    fireEvent.change(screen.getByLabelText(/Nome de usuário/i), { target: { value: 'gary' } });
    fireEvent.change(screen.getByLabelText(/^E-mail$/i), { target: { value: 'ash@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Senha \(/i), { target: { value: 'Abcdefgh!1' } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: 'Abcdefgh!1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() => expect(register).toHaveBeenCalled());
  });

  it('pede recuperação de senha', async () => {
    (requestPasswordReset as jest.Mock).mockResolvedValue({ message: 'ok' });
    renderAt(<ForgotPasswordPage />, '/forgot-password');
    fireEvent.change(screen.getByLabelText(/^E-mail$/i), { target: { value: 'ash@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalled());
  });

  it('redefine a senha com código', async () => {
    (confirmPasswordReset as jest.Mock).mockResolvedValue({ message: 'ok' });
    renderAt(<ResetPasswordPage />, '/reset-password', { email: 'ash@example.com' });
    fireEvent.change(screen.getByLabelText(/^E-mail$/i), { target: { value: 'ash@example.com' } });
    fireEvent.change(screen.getByLabelText(/Código/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/^Nova senha/i), { target: { value: 'Abcdefgh!1' } });
    fireEvent.change(screen.getByLabelText(/Confirmar nova senha/i), { target: { value: 'Abcdefgh!1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    await waitFor(() => expect(confirmPasswordReset).toHaveBeenCalled());
  });

  it('confirma o e-mail com código de 8 dígitos', async () => {
    (sendEmailVerificationCode as jest.Mock).mockResolvedValue({ message: 'enviado' });
    renderAt(<VerifyEmailPage />, '/verify-email', { email: 'ash@example.com', fromRegister: true });
    expect(await screen.findByDisplayValue('ash@example.com')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Código/i), { target: { value: '12345678' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e-mail' }));
    await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument());
  });
});
