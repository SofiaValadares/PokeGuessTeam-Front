import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { InlineAlert } from '../../ds';
import type { Pokemon } from '../../model';
import { toFriendlyUserMessage } from '../../services/http';
import {
  createAdminEvent,
  fetchAdminEvents,
  updateAdminEvent,
  type BonusEventUpsert,
} from '../../services/adminService';
import { getPokedexAll } from '../../store/slices/cache/queries';
import { useAdminMode } from '../../store/providers/AdminModeProvider';

export type EventFormState = {
  name: string;
  description: string;
  durationHours: number;
  xpMultiplier: number;
  pokedexNumbers: number[];
};

export const emptyEventForm: EventFormState = {
  name: '',
  description: '',
  durationHours: 24,
  xpMultiplier: 2,
  pokedexNumbers: [],
};

type AdminEventFormContextValue = {
  isEdit: boolean;
  eventId?: string;
  form: EventFormState;
  setForm: Dispatch<SetStateAction<EventFormState>>;
  allPokemon: Pokemon[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  detailsValid: boolean;
  basePath: string;
  save: () => Promise<void>;
  goToPokemon: () => void;
  goToDetails: () => void;
  cancel: () => void;
};

const AdminEventFormContext = createContext<AdminEventFormContextValue | null>(null);

export function useAdminEventForm(): AdminEventFormContextValue {
  const ctx = useContext(AdminEventFormContext);
  if (!ctx) {
    throw new Error('useAdminEventForm deve ser usado dentro de AdminEventFormLayout');
  }
  return ctx;
}

export default function AdminEventFormLayout() {
  const { eventId } = useParams<{ eventId?: string }>();
  const isEdit = Boolean(eventId);
  const navigate = useNavigate();
  const { isMasterAdmin } = useAdminMode();
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePath = isEdit ? `/admin/events/${eventId}/edit` : '/admin/events/new';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const entries = await getPokedexAll();
      setAllPokemon(entries.map((e) => e.pokemon));

      if (!eventId) {
        setForm(emptyEventForm);
        return;
      }

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
      });
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar o formulário.'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const detailsValid =
    form.name.trim().length > 0 &&
    form.description.trim().length > 0 &&
    Number(form.durationHours) >= 1 &&
    Number(form.xpMultiplier) >= 1;

  const goToPokemon = useCallback(() => {
    if (!detailsValid) {
      setError('Preenche nome, descrição, duração e multiplicador antes de continuar.');
      return;
    }
    setError(null);
    navigate(`${basePath}/pokemon`);
  }, [basePath, detailsValid, navigate]);

  const goToDetails = useCallback(() => {
    setError(null);
    navigate(basePath);
  }, [basePath, navigate]);

  const cancel = useCallback(() => {
    navigate('/admin/events');
  }, [navigate]);

  const save = useCallback(async () => {
    if (!detailsValid) {
      setError('Preenche nome, descrição, duração e multiplicador.');
      navigate(basePath);
      return;
    }
    if (form.pokedexNumbers.length === 0) {
      setError('Seleciona pelo menos um Pokémon.');
      return;
    }
    setBusy(true);
    setError(null);
    const body: BonusEventUpsert = {
      name: form.name.trim(),
      description: form.description.trim(),
      durationHours: Number(form.durationHours) || 1,
      xpMultiplier: Number(form.xpMultiplier) || 1,
      pokedexNumbers: form.pokedexNumbers,
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
  }, [basePath, detailsValid, eventId, form, isEdit, navigate]);

  const value = useMemo<AdminEventFormContextValue>(
    () => ({
      isEdit,
      eventId,
      form,
      setForm,
      allPokemon,
      loading,
      busy,
      error,
      setError,
      detailsValid,
      basePath,
      save,
      goToPokemon,
      goToDetails,
      cancel,
    }),
    [
      allPokemon,
      basePath,
      busy,
      cancel,
      detailsValid,
      error,
      eventId,
      form,
      goToDetails,
      goToPokemon,
      isEdit,
      loading,
      save,
    ],
  );

  if (!isMasterAdmin) {
    return (
      <>
        <InlineAlert tone="error">Só o master admin pode criar ou editar eventos.</InlineAlert>
        <Link to="/admin/events">Voltar aos eventos</Link>
      </>
    );
  }

  return (
    <AdminEventFormContext.Provider value={value}>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {loading ? <p className="ds-body-muted">A carregar…</p> : null}
      {!loading ? <Outlet /> : null}
    </AdminEventFormContext.Provider>
  );
}
