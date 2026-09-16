import { FormEvent, useState } from 'react';
import { Bot, SendHorizonal } from 'lucide-react';
import { Button } from '../../../../ds';
import { askHistoryAssistant } from '../../../../services/historyAiService';

export type HistoryAssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function makeMessageId(): string {
  if (typeof globalThis !== 'undefined' && 'crypto' in globalThis && globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function HistoryAssistant() {
  const [messages, setMessages] = useState<HistoryAssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Pergunta-me sobre o teu histórico e eu tento resumir o que aconteceu nas tuas partidas.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: HistoryAssistantMessage = {
      id: makeMessageId(),
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const response = await askHistoryAssistant(trimmed);
      const assistantMessage: HistoryAssistantMessage = {
        id: makeMessageId(),
        role: 'assistant',
        content: response.answer || 'Não consegui interpretar essa pergunta neste momento.',
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível consultar o assistente.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          border: '1px solid var(--ds-color-border-default)',
          borderRadius: 'var(--ds-radius-md)',
          background: 'var(--ds-color-bg-raised)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {message.role === 'assistant' ? <Bot size={16} aria-hidden /> : null}
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 10px',
                borderRadius: 12,
                background:
                  message.role === 'assistant'
                    ? 'var(--ds-color-bg-elevated)'
                    : 'var(--ds-color-primary-soft, rgba(59, 130, 246, 0.14))',
                border: '1px solid var(--ds-color-border-default)',
                color: 'var(--ds-color-text-primary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            color: 'var(--ds-color-text-danger, #ef4444)',
            fontSize: 'var(--ds-text-sm)',
          }}
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          aria-label="Mensagem do assistente"
          placeholder="Pergunte ao assistente..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid var(--ds-color-border-default)',
            background: 'var(--ds-color-bg-body)',
            color: 'var(--ds-color-text-primary)',
            borderRadius: 'var(--ds-radius-sm)',
            padding: '10px 12px',
          }}
          disabled={sending}
        />
        <Button type="submit" variant="primary" size="md" disabled={sending || !input.trim()}>
          {sending ? 'A enviar...' : 'Perguntar'}
          <SendHorizonal size={16} aria-hidden style={{ marginLeft: 6 }} />
        </Button>
      </form>
    </div>
  );
}
