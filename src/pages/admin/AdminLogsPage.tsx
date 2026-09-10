import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, RefreshCw } from 'lucide-react';
import { Button, InlineAlert, TextField } from '../../ds';
import { toFriendlyUserMessage } from '../../services/http';
import {
  fetchAdminLogs,
  type SystemLogEntry,
  type SystemLogLevel,
} from '../../services/adminService';
import styles from './admin.module.css';

const LEVELS: { id: SystemLogLevel; label: string }[] = [
  { id: 'ALL', label: 'ALL' },
  { id: 'ERROR', label: 'ERROR' },
  { id: 'WARN', label: 'WARN' },
  { id: 'INFO', label: 'INFO' },
  { id: 'DEBUG', label: 'DEBUG' },
];

function levelClass(level: string): string {
  switch (level) {
    case 'ERROR':
      return styles.logError;
    case 'WARN':
      return styles.logWarn;
    case 'INFO':
      return styles.logInfo;
    case 'DEBUG':
      return styles.logDebug;
    default:
      return styles.logOther;
  }
}

export default function AdminLogsPage() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [level, setLevel] = useState<SystemLogLevel>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<SystemLogEntry[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLogs({
        level,
        q: searchQuery,
        limit: 500,
      });
      setEntries(data.entries);
      setTruncated(data.truncated);
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar os logs.'));
    } finally {
      setLoading(false);
    }
  }, [level, searchQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }
    const el = scrollerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries, autoScroll, loading]);

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="ds-h1">Logs do Sistema</h1>
        <div className={styles.headerActions}>
          <Button
            type="button"
            size="sm"
            variant={autoScroll ? 'primary' : 'secondary'}
            onClick={() => setAutoScroll((v) => !v)}
            aria-pressed={autoScroll}
            title={autoScroll ? 'Autoscroll ligado' : 'Autoscroll desligado'}
          >
            <ArrowDownToLine size={16} aria-hidden />
            Autoscroll
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} aria-hidden />
            Atualizar
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <TextField
            label="Pesquisar"
            name="logSearch"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Palavra-chave, módulo ou mensagem"
          />
        </div>
        <div className={styles.filters} role="group" aria-label="Nível de log">
          {LEVELS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={[styles.filterChip, level === f.id ? styles.filterChipActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setLevel(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {truncated ? (
        <p className="ds-body-muted">A mostrar as entradas mais recentes do ficheiro de log.</p>
      ) : null}
      {loading ? <p className="ds-body-muted">A carregar…</p> : null}

      <div ref={scrollerRef} className={styles.logTerminal} role="log" aria-live="polite">
        {!loading && entries.length === 0 ? (
          <p className={styles.logEmpty}>Nenhum log encontrado.</p>
        ) : (
          entries.map((entry, index) => (
            <pre
              key={`${entry.timestamp}-${entry.origin}-${index}`}
              className={[styles.logLine, levelClass(entry.level)].join(' ')}
            >
              {entry.raw}
            </pre>
          ))
        )}
      </div>
    </>
  );
}
