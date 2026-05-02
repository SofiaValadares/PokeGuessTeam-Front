import { Card, ThemeToggle } from '../../ds';
import { useTheme } from '../../theme';
import styles from './aparencia.module.css';

export default function AparienciaPage() {
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <Card padding="md">
      <h1 className="ds-h1">Aparência</h1>
      <p className="ds-body-muted">Personalize a interface do PokeTeamGuess.</p>

      <section aria-labelledby="theme-heading">
        <h2 id="theme-heading" className={styles.sectionTitle}>
          Modo escuro
        </h2>
        <div
          className={styles.toggleRow}
          role="group"
          aria-labelledby="theme-heading"
        >
          <ThemeToggle dark={dark} onToggle={() => setTheme(dark ? 'light' : 'dark')} />
        </div>
        <p className={styles.hint}>
          O interruptor aplica o tema em todas as páginas e guarda a preferência neste dispositivo.
        </p>
      </section>
    </Card>
  );
}
