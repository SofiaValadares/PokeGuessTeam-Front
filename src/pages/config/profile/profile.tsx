import { useAuth } from '../../../store/providers/AuthProvider';
import { Card } from '../../../ds';
import { ProfileIdentityBar } from './components/ProfileIdentityBar';
import { ProfileMetaStrip } from './components/ProfileMetaStrip';
import { ProfileEmailSection } from './components/ProfileEmailSection';
import { ProfileCredentialsSection, ProfileDeleteSection } from './components/ProfileCredentialsSection';
import { useProfileSettings } from './hooks';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { me } = useAuth();
  const settings = useProfileSettings();

  return (
    <Card padding="md" className={styles.pageCard}>
      <h1 className="ds-h1">Perfil</h1>
      <ProfileIdentityBar settings={settings} />
      <ProfileMetaStrip me={me} />
      <ProfileEmailSection />
      <ProfileCredentialsSection settings={settings} />
      <ProfileDeleteSection />
    </Card>
  );
}
