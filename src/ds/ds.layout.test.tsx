import { cleanup, fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import {
  AppHeader,
  Button,
  Card,
  ConfirmModal,
  InlineAlert,
  LoadingOverlay,
  PageSection,
  PageShell,
  Spinner,
  TextField,
  ThemeToggle,
} from './index';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { renderWithApp } from '../test/render';

function ThemeProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme}
    </button>
  );
}

describe('design system e layout autenticado', () => {
  it('renderiza componentes DS e o layout com modo admin', () => {
    const onConfirm = jest.fn();
    const onToggle = jest.fn();
    renderWithApp(
      <>
        <AppHeader end={<span>end</span>} />
        <AppHeader navEnabled={false} />
        <Button variant="ghost" size="lg">
          Ok
        </Button>
        <Card padding="lg" glow>
          card
        </Card>
        <InlineAlert tone="success">ok</InlineAlert>
        <InlineAlert tone="error">err</InlineAlert>
        <PageShell width="wide">
          <PageSection title="Secção" subtitle="sub" action={<span>act</span>} divider grow>
            corpo
          </PageSection>
        </PageShell>
        <Spinner size="sm" label="spin" />
        <LoadingOverlay open label="overlay" />
        <LoadingOverlay open={false} />
        <TextField label="Nome" name="nome" hint="dica" passwordToggle={false} />
        <TextField label="Segredo" name="segredo" type="password" passwordToggle />
        <ThemeToggle label="Tema" dark onToggle={onToggle} />
        <ConfirmModal
          open
          title="Confirmar?"
          description="mesmo?"
          onConfirm={onConfirm}
          onCancel={jest.fn()}
        >
          extra
        </ConfirmModal>
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });

    cleanup();
    renderWithApp(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /dark|light/i }));

    cleanup();
    renderWithApp(
      <Routes>
        <Route path="/" element={<AuthenticatedLayout />}>
          <Route index element={<p>início</p>} />
        </Route>
        <Route path="/admin/users" element={<AuthenticatedLayout />}>
          <Route index element={<p>admin</p>} />
        </Route>
        <Route path="/game/bot" element={<AuthenticatedLayout />}>
          <Route index element={<p>jogo</p>} />
        </Route>
      </Routes>,
    );
    expect(screen.getByText('início')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /modo admin/i }));
  });
});
