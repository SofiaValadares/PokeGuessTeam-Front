import { useEffect, useRef } from 'react';
import { useAuth } from '../../../store/providers/AuthProvider';
import { Card } from '../../../ds';
import { ProfileIdentityBar } from './components/ProfileIdentityBar';
import { ProfileMetaStrip } from './components/ProfileMetaStrip';
import { ProfileEmailSection } from './components/ProfileEmailSection';
import { ProfileCredentialsSection, ProfileDeleteSection } from './components/ProfileCredentialsSection';
import { useProfileEmailChange, useProfileSettings } from './hooks';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { me } = useAuth();
  const settings = useProfileSettings();
  const emailChange = useProfileEmailChange();
  const emailSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!emailChange.editorOpen || !emailSectionRef.current) return;
    emailSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [emailChange.editorOpen]);

  return (
    <Card padding="md" className={styles.pageCard}>
      <h1 className="ds-h1">Perfil</h1>
      <ProfileIdentityBar settings={settings} />
      <ProfileMetaStrip
        me={me}
        onEditEmail={emailChange.openEditor}
        emailEditorOpen={emailChange.editorOpen}
      />
      <ProfileEmailSection ref={emailSectionRef} email={emailChange} />
      <ProfileCredentialsSection settings={settings} />
      <ProfileDeleteSection />
    </Card>
  );
}
