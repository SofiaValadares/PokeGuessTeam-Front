import { apiFetchJson } from './http';

export type HistoryAssistantRequest = {
  message: string;
};

export type HistoryAssistantResponse = {
  answer: string;
  operation?: string | null;
  data?: Record<string, unknown> | null;
};

export async function askHistoryAssistant(message: string): Promise<HistoryAssistantResponse> {
  return apiFetchJson<HistoryAssistantResponse>('/api/ai/history/chat', {
    method: 'POST',
    body: JSON.stringify({ message } satisfies HistoryAssistantRequest),
  });
}
