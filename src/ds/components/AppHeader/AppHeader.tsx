import { BookOpen, Home, Monitor, Trees } from 'lucide-react';
import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './AppHeader.module.css';

const navIconProps = {
  size: 22 as const,
  strokeWidth: 2 as const,
  'aria-hidden': true as const,
};

export type AppHeaderProps = {
  /** Conteúdo à direita (ex.: menu de utilizador). */
  end?: ReactNode;
  /** Quando `false`, os atalhos do nav principal não são mostrados (visitante). Por omissão `true`. */
  navEnabled?: boolean;
};

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
                  <Home className={styles.navIcon} {...navIconProps} />
                </NavLink>
                <NavLink
                  to="/pc"
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="PC — loja Pokémon"
                  title="PC — loja Pokémon"
                >
                  <Monitor className={styles.navIcon} {...navIconProps} />
                </NavLink>
                <NavLink
                  to="/wild-area"
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Wild Area"
                  title="Wild Area"
                >
                  <Trees className={styles.navIcon} {...navIconProps} />
                </NavLink>
                <NavLink
                  to="/pokedex"
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Pokédex"
                >
                  <BookOpen className={styles.navIcon} {...navIconProps} />
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
