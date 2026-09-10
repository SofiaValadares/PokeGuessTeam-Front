import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ConfirmModal, InlineAlert, Spinner } from '../../ds';
import buttonStyles from '../../ds/components/Button/Button.module.css';
import { toFriendlyUserMessage } from '../../services/http';
import {
  deleteAdminEvent,
  endAdminEvent,
  fetchAdminEvents,
  startAdminEvent,
  type BonusEvent,
} from '../../services/adminService';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import styles from './admin.module.css';

function adminButtonLinkClass(variant: 'primary' | 'secondary', size: 'sm' | 'md') {
  return [buttonStyles.button, buttonStyles[variant], buttonStyles[size], styles.linkButton].join(' ');
}

type ConfirmAction =
  | { type: 'start'; event: BonusEvent }
  | { type: 'end'; event: BonusEvent }
  | { type: 'delete'; event: BonusEvent };

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const { isMasterAdmin } = useAdminMode();
  const [events, setEvents] = useState<BonusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await fetchAdminEvents());
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar eventos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeEvent = useMemo(() => events.find((e) => e.status === 'ACTIVE') ?? null, [events]);
  const otherEvents = useMemo(() => events.filter((e) => e.status !== 'ACTIVE'), [events]);
  const hasActive = activeEvent != null;

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    setError(null);
    try {
      if (confirm.type === 'start') {
        await startAdminEvent(confirm.event.id);
      } else if (confirm.type === 'end') {
        await endAdminEvent(confirm.event.id);
      } else {
        await deleteAdminEvent(confirm.event.id);
      }
      setConfirm(null);
      await load();
    } catch (e) {
      const fallback =
        confirm.type === 'start'
          ? 'Não foi possível iniciar o evento.'
          : confirm.type === 'end'
            ? 'Não foi possível terminar o evento.'
            : 'Não foi possível remover o evento.';
      setError(toFriendlyUserMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const renderEventCard = (ev: BonusEvent, active = false) => (
    <article
      key={ev.id}
      className={[styles.eventItem, styles.eventItemClickable, active ? styles.eventItemActive : '']
        .filter(Boolean)
        .join(' ')}
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/admin/events/${ev.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/admin/events/${ev.id}`);
        }
      }}
    >
      <div className={styles.eventMeta}>
        <strong>{ev.name}</strong>
        <span className={active ? `${styles.badge} ${styles.badgeLive}` : styles.badge}>{ev.status}</span>
      </div>
      <p className={styles.eventDescription}>{ev.description}</p>
      <p className="ds-body-muted">
        ×{ev.xpMultiplier} XP · {ev.durationHours}h · {ev.pokedexNumbers.length} Pokémon
      </p>
      {active && ev.endsAt ? (
        <p className="ds-body-muted">Termina: {new Date(ev.endsAt).toLocaleString('pt-PT')}</p>
      ) : null}
      <div className={styles.actions} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        {ev.status !== 'ACTIVE' && !hasActive ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={() => setConfirm({ type: 'start', event: ev })}
          >
            {ev.status === 'ENDED' ? 'Reiniciar' : 'Iniciar'}
          </Button>
        ) : null}
        {isMasterAdmin && active ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={() => setConfirm({ type: 'end', event: ev })}
          >
            Terminar
          </Button>
        ) : null}
        {isMasterAdmin && ev.status !== 'ACTIVE' ? (
          <>
            <Link to={`/admin/events/${ev.id}/edit`} className={adminButtonLinkClass('secondary', 'sm')}>
              Editar
            </Link>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setConfirm({ type: 'delete', event: ev })}
            >
              Remover
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );

  const confirmCopy =
    confirm?.type === 'start'
      ? {
          title: confirm.event.status === 'ENDED' ? 'Reiniciar evento' : 'Iniciar evento',
          description: `Queres ${confirm.event.status === 'ENDED' ? 'reiniciar' : 'iniciar'} “${confirm.event.name}”? Passa a ativo e desbloqueia o modo online de evento.`,
          confirmLabel: confirm.event.status === 'ENDED' ? 'Reiniciar' : 'Iniciar',
        }
      : confirm?.type === 'end'
        ? {
            title: 'Terminar evento',
            description: `Queres terminar “${confirm.event.name}” mais cedo? O modo online de evento deixa de estar disponível.`,
            confirmLabel: 'Terminar',
          }
        : confirm?.type === 'delete'
          ? {
              title: 'Remover evento',
              description: 'Esta ação não pode ser desfeita.',
              confirmLabel: 'Remover',
            }
          : null;

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="ds-h1">Eventos</h1>
        {isMasterAdmin ? (
          <Link to="/admin/events/new" className={adminButtonLinkClass('primary', 'md')}>
            Criar evento
          </Link>
        ) : null}
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {!isMasterAdmin ? (
        <InlineAlert tone="success">
          Como admin podes iniciar eventos. Criar, editar, terminar e remover é exclusivo do master.
        </InlineAlert>
      ) : null}
      {loading ? <Spinner label="A carregar eventos…" /> : null}

      {activeEvent ? (
        <section aria-label="Evento ativo">
          <h2 className="ds-h2">Em andamento</h2>
          {renderEventCard(activeEvent, true)}
        </section>
      ) : null}

      <section aria-label="Lista de eventos">
        <h2 className="ds-h2">{activeEvent ? 'Outros eventos' : 'Lista de eventos'}</h2>
        <div className={styles.eventList}>
          {otherEvents.map((ev) => renderEventCard(ev))}
          {!loading && otherEvents.length === 0 && !activeEvent ? (
            <p className="ds-body-muted">Ainda não há eventos.</p>
          ) : null}
          {!loading && otherEvents.length === 0 && activeEvent ? (
            <p className="ds-body-muted">Não há mais eventos na lista.</p>
          ) : null}
        </div>
      </section>

      <ConfirmModal
        open={confirm != null && confirmCopy != null}
        title={confirmCopy?.title ?? ''}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
        confirming={busy}
      />
    </>
  );
}
