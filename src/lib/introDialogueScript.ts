import { PROFESSOR, RIVAL } from './gameCharacters';

export type IntroSpeaker = 'professor' | 'player' | 'rival';

export type IntroChoice = {
  id: string;
  label: string;
};

export type IntroDialogueBeat = {
  id: string;
  speaker: IntroSpeaker;
  text: string;
  /** Escolhas cosméticas — qualquer opção avança para o mesmo próximo beat. */
  choices?: IntroChoice[];
};

export const INTRO_DIALOGUE_BEATS: IntroDialogueBeat[] = [
  {
    id: 'professor-welcome',
    speaker: 'professor',
    text: 'Bem-vindo à Grande Maratona de Identificação, {{playerName}}. Aqui, a maestria mede-se pelo conhecimento sobre cada espécie.',
  },
  {
    id: 'professor-mission',
    speaker: 'professor',
    text: 'Desvendarás equipas secretas de seis Pokémon usando pistas de tipo, geração, cor, altura e peso — e provarás que o teu raciocínio supera o dos rivais.',
  },
  {
    id: 'player-response-1',
    speaker: 'player',
    text: 'Como te sentes perante o desafio?',
    choices: [
      { id: 'ready', label: 'Estou pronto para começar!' },
      { id: 'nervous', label: 'Parece difícil…' },
      { id: 'curious', label: 'Conte-me mais sobre os duelos.' },
    ],
  },
  {
    id: 'professor-duel',
    speaker: 'professor',
    text: 'Cada duelo é um experimento: escolhes um palpite, o sistema revela o que coincide com a equipa adversária, e vences quem identificar os seis primeiro.',
  },
  {
    id: 'rival-challenge',
    speaker: 'rival',
    text: 'Heh! {{playerName}}, certo? Sou o {{rivalName}} — impaciente, competitivo e o teu primeiro adversário. Não te distraias!',
  },
  {
    id: 'player-response-2',
    speaker: 'player',
    text: 'Como respondes ao desafio?',
    choices: [
      { id: 'confident', label: 'Vamos ver quem ganha!' },
      { id: 'polite', label: 'Boa sorte para nós dois.' },
      { id: 'tease', label: 'Espero que estejas preparado.' },
    ],
  },
  {
    id: 'rival-retort',
    speaker: 'rival',
    text: 'Hah! Gosto dessa energia. Nos vemos na arena — não vou facilitar.',
  },
  {
    id: 'professor-farewell',
    speaker: 'professor',
    text: 'Explora a Área Selvagem, regista espécies na Pokédex e escolhe um modo de duelo quando quiseres. Boa maratona, {{playerName}}!',
  },
];

export function formatIntroText(
  template: string,
  playerName: string,
): string {
  return template
    .replaceAll('{{playerName}}', playerName)
    .replaceAll('{{rivalName}}', RIVAL.name)
    .replaceAll('{{professorName}}', PROFESSOR.name);
}

export function speakerLabel(speaker: IntroSpeaker, playerName: string): string {
  switch (speaker) {
    case 'professor':
      return PROFESSOR.shortName;
    case 'rival':
      return RIVAL.shortName;
    case 'player':
      return playerName;
  }
}
