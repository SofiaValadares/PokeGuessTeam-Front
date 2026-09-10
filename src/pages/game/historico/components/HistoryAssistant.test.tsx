import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HistoryAssistant } from './HistoryAssistant';
import * as historyAiService from '../../../../services/historyAiService';

jest.mock('../../../../services/historyAiService', () => ({
  askHistoryAssistant: jest.fn(),
}));

describe('HistoryAssistant', () => {
  it('envia a pergunta e mostra a resposta do assistente', async () => {
    const askHistoryAssistantMock = jest.mocked(historyAiService.askHistoryAssistant);
    askHistoryAssistantMock.mockResolvedValue({
      answer: 'Sua taxa de vitória foi de 60%.',
      operation: 'get_win_rate',
      data: { wins: 6, losses: 4, winRate: 60 },
    });

    render(<HistoryAssistant />);

    fireEvent.change(screen.getByPlaceholderText('Pergunte ao assistente...'), {
      target: { value: 'Qual foi minha taxa de vitória?' },
    });

    fireEvent.click(screen.getByRole('button', { name: /perguntar/i }));

    await waitFor(() => {
      expect(askHistoryAssistantMock).toHaveBeenCalledWith('Qual foi minha taxa de vitória?');
    });

    expect(await screen.findByText('Sua taxa de vitória foi de 60%.')).toBeInTheDocument();
  });
});
