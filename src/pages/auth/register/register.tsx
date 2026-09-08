import { SignUp } from '@clerk/clerk-react';
import { AuthPageLayout } from '../../../components/auth/AuthPageLayout';
import styles from '../login/clerk-auth.module.css';

export default function RegisterPage() {
  return (
    <AuthPageLayout>
      <div className={styles.clerkWrap}>
        <SignUp
          routing="hash"
          signInUrl="/login"
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
