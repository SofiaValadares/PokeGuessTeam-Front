import { useEffect } from 'react';
import { Button } from '../../ds';
import { AdminEventPokemonPicker } from './AdminEventPokemonPicker';
import { useAdminEventForm } from './AdminEventFormLayout';
import styles from './admin.module.css';

export default function AdminEventPokemonPage() {
  const {
    isEdit,
    form,
    setForm,
    allPokemon,
    busy,
    detailsValid,
    goToDetails,
    save,
    cancel,
  } = useAdminEventForm();

  useEffect(() => {
    if (!detailsValid) {
      goToDetails();
    }
  }, [detailsValid, goToDetails]);

  if (!detailsValid) {
    return null;
  }

  return (
    <div className={styles.eventForm}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.stepLabel}>Passo 2 de 2</p>
          <h1 className="ds-h1">{isEdit ? 'Pokémon do evento' : 'Selecionar Pokémon'}</h1>
        </div>
        <Button type="button" variant="secondary" size="md" onClick={goToDetails}>
          Voltar aos detalhes
        </Button>
      </div>

      <section
        className={`${styles.formSection} ${styles.formSectionWide}`}
        aria-labelledby="event-pokemon-heading"
      >
        <h2 id="event-pokemon-heading" className="ds-h2">
          Pokémon do evento
        </h2>
        <p className="ds-body-muted">
          Filtra por pesquisa, tipo ou geração. Podes selecionar todos os que correspondem ao filtro.
        </p>
        <AdminEventPokemonPicker
          allPokemon={allPokemon}
          selectedNumbers={form.pokedexNumbers}
          onChange={(pokedexNumbers) => setForm((f) => ({ ...f, pokedexNumbers }))}
          disabled={busy}
        />
      </section>

      <div className={styles.actions}>
        <Button type="button" variant="primary" size="md" disabled={busy} onClick={() => void save()}>
          {isEdit ? 'Guardar alterações' : 'Criar evento'}
        </Button>
        <Button type="button" variant="secondary" size="md" disabled={busy} onClick={goToDetails}>
          Voltar
        </Button>
        <Button type="button" variant="secondary" size="md" disabled={busy} onClick={cancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
