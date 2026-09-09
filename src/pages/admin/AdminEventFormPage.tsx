import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, InlineAlert, TextField } from '../../ds';
import { toFriendlyUserMessage } from '../../services/http';
import {
  createAdminEvent,
  fetchAdminEvents,
  updateAdminEvent,
  type BonusEventUpsert,
} from '../../services/adminService';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import styles from './admin.module.css';

const emptyForm: BonusEventUpsert & { pokedexText: string } = {
  name: '',
  description: '',
  durationHours: 24,
  xpMultiplier: 2,
  pokedexNumbers: [],
  pokedexText: '',
};

function parsePokedexText(text: string): number[] {
  const nums = text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);
  return Array.from(new Set(nums));
}

export default function AdminEventFormPage() {
  const { eventId } = useParams<{ eventId?: string }>();
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();
  const { isMasterAdmin } = useAdminMode();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const events = await fetchAdminEvents();
      const ev = events.find((e) => e.id === eventId);
      if (!ev) {
        setError('Evento não encontrado.');
        return;
      }
      if (ev.status === 'ACTIVE') {
        setError('Não é possível editar um evento em andamento.');
        return;
      }
      setForm({
        name: ev.name,
        description: ev.description,
        durationHours: ev.durationHours,
        xpMultiplier: ev.xpMultiplier,
        pokedexNumbers: ev.pokedexNumbers,
        pokedexText: ev.pokedexNumbers.join(', '),
      });
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar o evento.'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  if (!isMasterAdmin) {
    return (
      <>
        <InlineAlert tone="error">Só o master admin pode criar ou editar eventos.</InlineAlert>
        <Link to="/admin/events">Voltar aos eventos</Link>
      </>
    );
  }

  const save = async () => {
    const pokedexNumbers = parsePokedexText(form.pokedexText);
    if (!form.name.trim() || !form.description.trim() || pokedexNumbers.length === 0) {
      setError('Preenche nome, descrição e pelo menos um nº da Pokédex.');
      return;
    }
    setBusy(true);
    setError(null);
    const body: BonusEventUpsert = {
      name: form.name.trim(),
      description: form.description.trim(),
      durationHours: Number(form.durationHours) || 1,
      xpMultiplier: Number(form.xpMultiplier) || 1,
      pokedexNumbers,
    };
    try {
      if (isEdit && eventId) {
        await updateAdminEvent(eventId, body);
      } else {
        await createAdminEvent(body);
      }
      navigate('/admin/events');
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível guardar o evento.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="ds-h1">{isEdit ? 'Editar evento' : 'Criar evento'}</h1>
        <Button type="button" variant="secondary" size="md" onClick={() => navigate('/admin/events')}>
          Voltar
        </Button>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {loading ? <p className="ds-body-muted">A carregar…</p> : null}

      {!loading ? (
        <div className={styles.formPanel}>
          <div className={styles.formGrid}>
            <TextField
              label="Nome"
              name="eventName"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <label className={styles.textareaLabel}>
              Descrição
              <textarea
                name="eventDescription"
                rows={4}
                className={styles.textarea}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <div className={styles.formRow}>
              <TextField
                label="Duração (horas, ao iniciar)"
                name="durationHours"
                value={String(form.durationHours)}
                onChange={(e) => setForm((f) => ({ ...f, durationHours: Number(e.target.value) || 1 }))}
              />
              <TextField
                label="Multiplicador de XP"
                name="xpMultiplier"
                value={String(form.xpMultiplier)}
                onChange={(e) => setForm((f) => ({ ...f, xpMultiplier: Number(e.target.value) || 1 }))}
              />
            </div>
            <TextField
              label="Pokémon (nºs Pokédex, separados por vírgula)"
              name="pokedex"
              value={form.pokedexText}
              onChange={(e) => setForm((f) => ({ ...f, pokedexText: e.target.value }))}
              placeholder="1, 4, 7, 25"
            />
          </div>
          <div className={styles.actions}>
            <Button type="button" variant="primary" size="md" disabled={busy} onClick={() => void save()}>
              {isEdit ? 'Guardar alterações' : 'Criar evento'}
            </Button>
            <Button type="button" variant="secondary" size="md" disabled={busy} onClick={() => navigate('/admin/events')}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
