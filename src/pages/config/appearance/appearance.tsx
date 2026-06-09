import { type ReactNode } from 'react';
import { Card, ThemeToggle } from '../../../ds';
import { useTheme } from '../../../theme';
import { usePreferences, type AppLocale, type UiDensity } from '../../../preferences';
import styles from './appearance.module.css';

function OptionButton({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={[styles.optionBtn, active ? styles.optionBtnActive : ''].filter(Boolean).join(' ')}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const { locale, density, reducedMotion, setLocale, setDensity, setReducedMotion } = usePreferences();
  const dark = theme === 'light' ? false : true;

  return (
    <Card padding="md" className={styles.pageCard}>
      <h1 className="ds-h1">Aparência</h1>
      <p className={styles.intro}>Personaliza a interface do PokeTeamGuess neste dispositivo.</p>

      <section className={styles.settingBlock} aria-labelledby="theme-heading">
        <h2 id="theme-heading" className={styles.sectionTitle}>
          Tema
        </h2>
        <div className={styles.toggleRow} role="group" aria-labelledby="theme-heading">
          <ThemeToggle dark={dark} onToggle={() => setTheme(dark ? 'light' : 'dark')} />
        </div>
        <p className={styles.hint}>Alterna entre modo escuro e claro em todas as páginas.</p>
      </section>

      <section className={styles.settingBlock} aria-labelledby="locale-heading">
        <h2 id="locale-heading" className={styles.sectionTitle}>
          Idioma
        </h2>
        <div className={styles.optionGroup} role="group" aria-labelledby="locale-heading">
          <OptionButton active={locale === 'pt'} onClick={() => setLocale('pt' as AppLocale)}>
            Português
          </OptionButton>
          <OptionButton active={locale === 'en'} onClick={() => setLocale('en' as AppLocale)} disabled>
            English (em breve)
          </OptionButton>
        </div>
        <p className={styles.hint}>
          A interface está em português. O suporte completo a inglês será adicionado numa atualização futura.
        </p>
      </section>

      <section className={styles.settingBlock} aria-labelledby="density-heading">
        <h2 id="density-heading" className={styles.sectionTitle}>
          Densidade da interface
        </h2>
        <div className={styles.optionGroup} role="group" aria-labelledby="density-heading">
          <OptionButton
            active={density === 'comfortable'}
            onClick={() => setDensity('comfortable' as UiDensity)}
          >
            Confortável
          </OptionButton>
          <OptionButton active={density === 'compact'} onClick={() => setDensity('compact' as UiDensity)}>
            Compacta
          </OptionButton>
        </div>
        <p className={styles.hint}>A densidade compacta reduz espaçamentos em listas, cartões e tabelas.</p>
      </section>

      <section className={styles.settingBlock} aria-labelledby="motion-heading">
        <h2 id="motion-heading" className={styles.sectionTitle}>
          Animações
        </h2>
        <div className={styles.optionGroup} role="group" aria-labelledby="motion-heading">
          <OptionButton active={!reducedMotion} onClick={() => setReducedMotion(false)}>
            Ativadas
          </OptionButton>
          <OptionButton active={reducedMotion} onClick={() => setReducedMotion(true)}>
            Reduzidas
          </OptionButton>
        </div>
        <p className={styles.hint}>
          Com animações reduzidas, transições e efeitos visuais (como no gacha) ficam mais discretos.
        </p>
      </section>
    </Card>
  );
}
