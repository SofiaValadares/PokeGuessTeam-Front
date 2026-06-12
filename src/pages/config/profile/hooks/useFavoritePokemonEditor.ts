import { useCallback, useEffect, useState } from 'react';
import { updateFavoritePokemon } from '../../../../services/profileService';
import { searchPokemon } from '../../../../store/slices/cache/queries';
import type { PokemonDto } from '../../../../api/types/pokemon';
import type { ProfileMe } from '../../../../model';
import { FetchStatus } from '../../../../types/fetchStatus';
import { mapProfileSubmitError } from '../actions/form';

export function useFavoritePokemonEditor(profileMe: ProfileMe | null, onSaved: () => void) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PokemonDto[]>([]);
  const [selected, setSelected] = useState<PokemonDto | null>(null);
  const [submitStatus, setSubmitStatus] = useState(FetchStatus.Idle);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetEditor = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setSubmitError(null);
    setSubmitStatus(FetchStatus.Idle);
  }, []);

  const openEditor = useCallback(() => {
    setSuccess(false);
    resetEditor();
    setEditorOpen(true);
  }, [resetEditor]);

  const cancelEditor = useCallback(() => {
    setEditorOpen(false);
    resetEditor();
  }, [resetEditor]);

  useEffect(() => {
    if (!editorOpen) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchPokemon(q, 15)
        .then(setResults)
        .catch(() => setResults([]));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [editorOpen, query]);

  const handleSave = useCallback(async () => {
    if (!selected) return;
    setSubmitError(null);
    setSubmitStatus(FetchStatus.Loading);
    try {
      await updateFavoritePokemon(selected.number);
      setSuccess(true);
      setEditorOpen(false);
      resetEditor();
      onSaved();
      setSubmitStatus(FetchStatus.Success);
    } catch (err) {
      setSubmitStatus(FetchStatus.Error);
      setSubmitError(mapProfileSubmitError(err));
    }
  }, [onSaved, resetEditor, selected]);

  const currentDex = profileMe?.favoritePokemonId
    ? Number.parseInt(profileMe.favoritePokemonId, 10)
    : null;

  return {
    editorOpen,
    openEditor,
    cancelEditor,
    query,
    setQuery,
    results,
    selected,
    setSelected,
    currentDex,
    canSave: selected != null,
    submitting: submitStatus === FetchStatus.Loading,
    submitError,
    success,
    handleSave,
  };
}
