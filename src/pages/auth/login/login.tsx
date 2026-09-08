import { SignIn, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { AuthPageLayout } from '../../../components/auth/AuthPageLayout';
import { Button, InlineAlert } from '../../../ds';
import { useAuth } from '../../../store/providers/AuthProvider';
import styles from './clerk-auth.module.css';

export default function LoginPage() {
  const { isSignedIn } = useClerkAuth();
  const { authenticated, bridgeError, logout, retryClerkBridge, authBootstrapping } = useAuth();

  if (!authBootstrapping && isSignedIn && !authenticated && bridgeError) {
    return (
      <AuthPageLayout skipAuthGate>
        <div className={styles.errorPanel}>
          <InlineAlert tone="error" role="alert">
            {bridgeError}
          </InlineAlert>
          <p className="ds-body-muted">
            O Clerk autenticou, mas o backend não criou a sessão do jogo. Confirma que o Spring está a
            correr com <code>CLERK_ISSUER</code> e <code>CLERK_SECRET_KEY</code>.
          </p>
          <div className={styles.actions}>
            <Button type="button" variant="primary" size="md" onClick={retryClerkBridge}>
              Tentar outra vez
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={() => void logout()}>
              Sair do Clerk
            </Button>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>
      <div className={styles.clerkWrap}>
        <SignIn
          routing="hash"
          signUpUrl="/register"
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: styles.clerkRoot,
              card: styles.clerkCard,
            },
          }}
        />
      </div>
    </AuthPageLayout>
  );
}
