import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, ConfirmModal, InlineAlert } from '../../ds';
import buttonStyles from '../../ds/components/Button/Button.module.css';
import { PokemonSprite } from '../../components/PokemonSprite';
import type { Pokemon } from '../../model';
import { toFriendlyUserMessage } from '../../services/http';
import {
  deleteAdminEvent,
  endAdminEvent,
  fetchAdminEvent,
  fetchAdminEvents,
  startAdminEvent,
  type BonusEvent,
} from '../../services/adminService';
import { getPokedexAll } from '../../store/slices/cache/queries';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import styles from './admin.module.css';

function adminButtonLinkClass(variant: 'primary' | 'secondary', size: 'sm' | 'md') {
  return [buttonStyles.button, buttonStyles[variant], buttonStyles[size], styles.linkButton].join(' ');
}

type ConfirmAction = 'start' | 'end' | 'delete';

export default function AdminEventViewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isMasterAdmin } = useAdminMode();
  const [event, setEvent] = useState<BonusEvent | null>(null);
  const [hasActiveOther, setHasActiveOther] = useState(false);
  const [pokemonByDex, setPokemonByDex] = useState<Map<number, Pokemon>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [ev, entries, allEvents] = await Promise.all([
        fetchAdminEvent(eventId),
        getPokedexAll(),
        fetchAdminEvents(),
      ]);
      setEvent(ev);
      setHasActiveOther(allEvents.some((e) => e.status === 'ACTIVE' && e.id !== ev.id));
      const map = new Map<number, Pokemon>();
      for (const entry of entries) map.set(entry.pokemon.number, entry.pokemon);
      setPokemonByDex(map);
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar o evento.'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pokemonList = useMemo(() => {
    if (!event) return [] as { number: number; name: string }[];
    return event.pokedexNumbers
      .map((n) => {
        const p = pokemonByDex.get(n);
        return { number: n, name: p?.name ?? `#${n}` };
      })
      .sort((a, b) => a.number - b.number);
  }, [event, pokemonByDex]);

  const runConfirm = async () => {
    if (!event || !confirm) return;
    setBusy(true);
    setError(null);
    try {
      if (confirm === 'start') {
        setEvent(await startAdminEvent(event.id));
      } else if (confirm === 'end') {
        setEvent(await endAdminEvent(event.id));
      } else {
        await deleteAdminEvent(event.id);
        navigate('/admin/events');
        return;
      }
      setConfirm(null);
      await load();
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível concluir a ação.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="ds-body-muted">A carregar…</p>;
  }

  if (!event) {
    return (
      <>
        {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
        <Link to="/admin/events">Voltar aos eventos</Link>
      </>
    );
  }

  const canStart = event.status !== 'ACTIVE' && !hasActiveOther;
  const canEnd = isMasterAdmin && event.status === 'ACTIVE';
  const canEdit = isMasterAdmin && event.status !== 'ACTIVE';
  const startLabel = event.status === 'ENDED' ? 'Reiniciar' : 'Iniciar';

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.stepLabel}>Detalhe do evento</p>
          <h1 className="ds-h1">{event.name}</h1>
        </div>
        <Button type="button" variant="secondary" size="md" onClick={() => navigate('/admin/events')}>
          Voltar
        </Button>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      <section className={`${styles.formSection} ${styles.formSectionWide}`}>
        <div className={styles.eventMeta}>
          <span
            className={
              event.status === 'ACTIVE' ? `${styles.badge} ${styles.badgeLive}` : styles.badge
            }
          >
            {event.status}
          </span>
          <span className="ds-body-muted">
            ×{event.xpMultiplier} XP · {event.durationHours}h · {event.pokedexNumbers.length} Pokémon
          </span>
        </div>
        <p className={styles.eventDescription}>{event.description}</p>
        {event.startedAt ? (
          <p className="ds-body-muted">Início: {new Date(event.startedAt).toLocaleString('pt-PT')}</p>
        ) : null}
        {event.endsAt ? (
          <p className="ds-body-muted">Fim: {new Date(event.endsAt).toLocaleString('pt-PT')}</p>
        ) : null}

        <div className={styles.actions}>
          {canStart ? (
            <Button type="button" variant="primary" size="md" disabled={busy} onClick={() => setConfirm('start')}>
              {startLabel}
            </Button>
          ) : null}
          {canEnd ? (
            <Button type="button" variant="primary" size="md" disabled={busy} onClick={() => setConfirm('end')}>
              Terminar
            </Button>
          ) : null}
          {canEdit ? (
            <>
              <Link to={`/admin/events/${event.id}/edit`} className={adminButtonLinkClass('secondary', 'md')}>
                Editar
              </Link>
              <Button type="button" variant="secondary" size="md" disabled={busy} onClick={() => setConfirm('delete')}>
                Remover
              </Button>
            </>
          ) : null}
        </div>
      </section>

      <section className={`${styles.formSection} ${styles.formSectionWide}`} aria-label="Pokémon do evento">
        <h2 className="ds-h2">Pokémon ({pokemonList.length})</h2>
        <ul className={styles.eventPokemonGrid}>
          {pokemonList.map((p) => (
            <li key={p.number} className={styles.eventPokemonCard}>
              <PokemonSprite dex={p.number} name={p.name} size={48} />
              <span className={styles.pickerRowMeta}>
                <span className={styles.pickerRowName}>{p.name}</span>
                <span className={styles.pickerRowDex}>#{p.number}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmModal
        open={confirm != null}
        title={
          confirm === 'start'
            ? event.status === 'ENDED'
              ? 'Reiniciar evento'
              : 'Iniciar evento'
            : confirm === 'end'
              ? 'Terminar evento'
              : 'Remover evento'
        }
        description={
          confirm === 'start'
            ? `Queres ${event.status === 'ENDED' ? 'reiniciar' : 'iniciar'} “${event.name}”?`
            : confirm === 'end'
              ? `Queres terminar “${event.name}” mais cedo?`
              : 'Esta ação não pode ser desfeita.'
        }
        confirmLabel={
          confirm === 'start' ? startLabel : confirm === 'end' ? 'Terminar' : 'Remover'
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
        confirming={busy}
      />
    </>
  );
}
