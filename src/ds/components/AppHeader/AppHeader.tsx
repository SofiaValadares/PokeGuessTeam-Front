import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './AppHeader.module.css';

export type AppHeaderProps = {
  /** Conteúdo à direita (ex.: menu de utilizador). */
  end?: ReactNode;
  /** Quando `false`, Início e Pokédex não são mostrados (visitante). Por omissão `true`. */
  navEnabled?: boolean;
};

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPokedex({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="11" r="0.75" fill="currentColor" />
      <circle cx="14" cy="11" r="0.75" fill="currentColor" />
      <path d="M9 7h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AppHeader({ end, navEnabled = true }: AppHeaderProps) {
  const showTrailing = navEnabled || Boolean(end);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          PokeTeamGuess
        </Link>
        {showTrailing ? (
          <div className={styles.trailing}>
            {navEnabled ? (
              <nav className={styles.nav} aria-label="Atalhos principais">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Início"
                >
                  <IconHome className={styles.navIcon} />
                </NavLink>
                <NavLink
                  to="/pokedex"
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Pokédex"
                >
                  <IconPokedex className={styles.navIcon} />
                </NavLink>
              </nav>
            ) : null}
            {end ? <div className={styles.end}>{end}</div> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
