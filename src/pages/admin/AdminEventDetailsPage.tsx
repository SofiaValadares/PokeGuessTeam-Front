import { Button, TextField } from '../../ds';
import { useAdminEventForm } from './AdminEventFormLayout';
import styles from './admin.module.css';

export default function AdminEventDetailsPage() {
  const { isEdit, form, setForm, busy, goToPokemon, cancel } = useAdminEventForm();

  return (
    <div className={styles.eventForm}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.stepLabel}>Passo 1 de 2</p>
          <h1 className="ds-h1">{isEdit ? 'Editar evento' : 'Criar evento'}</h1>
        </div>
        <Button type="button" variant="secondary" size="md" onClick={cancel}>
          Cancelar
        </Button>
      </div>

      <section
        className={`${styles.formSection} ${styles.formSectionWide}`}
        aria-labelledby="event-details-heading"
      >
        <h2 id="event-details-heading" className="ds-h2">
          Detalhes
        </h2>
        <div className={`${styles.formGrid} ${styles.detailsFormGrid}`}>
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
              rows={10}
              className={`${styles.textarea} ${styles.detailsTextarea}`}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className={styles.formRow}>
            <TextField
              label="Duração (horas, ao iniciar)"
              name="durationHours"
              value={String(form.durationHours)}
              onChange={(e) =>
                setForm((f) => ({ ...f, durationHours: Number(e.target.value) || 1 }))
              }
            />
            <TextField
              label="Multiplicador de XP"
              name="xpMultiplier"
              value={String(form.xpMultiplier)}
              onChange={(e) =>
                setForm((f) => ({ ...f, xpMultiplier: Number(e.target.value) || 1 }))
              }
            />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <Button type="button" variant="primary" size="md" disabled={busy} onClick={goToPokemon}>
          Continuar — Pokémon
        </Button>
        <Button type="button" variant="secondary" size="md" disabled={busy} onClick={cancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
