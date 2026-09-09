import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ConfirmModal, InlineAlert } from '../../ds';
import { toFriendlyUserMessage } from '../../services/http';
import {
  deleteAdminEvent,
  fetchAdminEvents,
  startAdminEvent,
  type BonusEvent,
} from '../../services/adminService';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import styles from './admin.module.css';

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const { isMasterAdmin } = useAdminMode();
  const [events, setEvents] = useState<BonusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const start = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await startAdminEvent(id);
      await load();
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível iniciar o evento.'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAdminEvent(deleteId);
      setDeleteId(null);
      await load();
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível remover o evento.'));
    } finally {
      setBusy(false);
    }
  };

  const renderEventCard = (ev: BonusEvent, active = false) => (
    <article
      key={ev.id}
      className={[styles.eventItem, active ? styles.eventItemActive : ''].filter(Boolean).join(' ')}
    >
      <div className={styles.eventMeta}>
        <strong>{ev.name}</strong>
        <span className={active ? `${styles.badge} ${styles.badgeLive}` : styles.badge}>{ev.status}</span>
        <span className="ds-body-muted">
          ×{ev.xpMultiplier} XP · {ev.durationHours}h
        </span>
      </div>
      <p className="ds-body-muted">{ev.description}</p>
      <p className="ds-body-muted">Pokémon: {ev.pokedexNumbers.join(', ')}</p>
      {active && ev.endsAt ? (
        <p className="ds-body-muted">Termina: {new Date(ev.endsAt).toLocaleString('pt-PT')}</p>
      ) : null}
      <div className={styles.actions}>
        {ev.status === 'DRAFT' ? (
          <Button type="button" size="sm" variant="primary" disabled={busy} onClick={() => void start(ev.id)}>
            Iniciar
          </Button>
        ) : null}
        {isMasterAdmin && ev.status !== 'ACTIVE' ? (
          <>
            <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/admin/events/${ev.id}/edit`)}>
              Editar
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setDeleteId(ev.id)}>
              Remover
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="ds-h1">Eventos</h1>
        {isMasterAdmin ? (
          <Button type="button" variant="primary" size="md" onClick={() => navigate('/admin/events/new')}>
            Criar evento
          </Button>
        ) : null}
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {loading ? <p className="ds-body-muted">A carregar…</p> : null}

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
        open={deleteId != null}
        title="Remover evento"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        confirming={busy}
      />
    </>
  );
}
