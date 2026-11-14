import { BookOpen, Home, Monitor, Trees } from 'lucide-react';
import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './AppHeader.module.css';

const navIconProps = {
  size: 22 as const,
  strokeWidth: 2 as const,
  'aria-hidden': true as const,
};

export type AppHeaderVariant = 'default' | 'admin' | 'lab';

export type AppHeaderProps = {
  /** Conteúdo à direita (ex.: menu de utilizador). */
  end?: ReactNode;
  /** Quando `false`, os atalhos do nav principal não são mostrados (visitante). Por omissão `true`. */
  navEnabled?: boolean;
  /** Substitui o nav padrão (ex.: navegação do painel admin). */
  nav?: ReactNode;
  /** Tom visual do shell (Admin / Lab). */
  variant?: AppHeaderVariant;
  /** Etiqueta junto à marca (ex.: Admin / Lab). */
  brandMeta?: ReactNode;
};

export function AppHeader({
  end,
  navEnabled = true,
  nav,
  variant = 'default',
  brandMeta,
}: AppHeaderProps) {
  const showDefaultNav = navEnabled && nav == null;
  const showCustomNav = nav != null;
  const showTrailing = showDefaultNav || showCustomNav || Boolean(end);
  const panel = variant === 'admin' || variant === 'lab';

  return (
    <header
      className={[
        styles.header,
        variant === 'admin' ? styles.headerAdmin : '',
        variant === 'lab' ? styles.headerLab : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={[styles.inner, panel ? styles.innerPanel : ''].filter(Boolean).join(' ')}>
        <div className={styles.brandBlock}>
          <Link to="/" className={styles.brand}>
            PokeTeamGuess
          </Link>
          {brandMeta ? <div className={styles.brandMeta}>{brandMeta}</div> : null}
        </div>
        {showTrailing ? (
          <div className={styles.trailing}>
            {showCustomNav ? (
              <nav
                className={[styles.nav, panel ? styles.navPanel : ''].filter(Boolean).join(' ')}
                aria-label={variant === 'lab' ? 'Navegação do Lab' : 'Navegação do painel'}
              >
                {nav}
              </nav>
            ) : null}
            {showDefaultNav ? (
              <nav className={styles.nav} aria-label="Atalhos principais">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Início"
                  title="Início"
                >
                  <Home className={styles.navIcon} {...navIconProps} />
                </NavLink>
                <NavLink
                  to="/pc"
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="PC — armazenamento de Pokémon"
                  title="PC — armazenamento de Pokémon"
                >
                  <Monitor className={styles.navIcon} {...navIconProps} />
                </NavLink>
                <NavLink
                  to="/wild-area"
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Área selvagem"
                  title="Área selvagem — capturar Pokémon"
                >
                  <Trees className={styles.navIcon} {...navIconProps} />
                </NavLink>
                <NavLink
                  to="/pokedex"
                  className={({ isActive }) =>
                    [styles.navBtn, isActive ? styles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Pokédex"
                  title="Pokédex"
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
