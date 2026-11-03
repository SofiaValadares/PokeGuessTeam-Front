import { getPasswordPolicyError, PASSWORD_MIN_LENGTH } from './auth/passwordPolicy';
import { usernameConflictsWithEmail, USERNAME_FROM_EMAIL_MESSAGE } from './auth/usernameEmail';
import {
  pokemonColorLabel,
  pokemonEvolutionStageLabel,
  pokemonRarityLabel,
  pokemonTypeLabel,
  POKEMON_MYSTERY_LABEL,
} from './pokemon/labels';
import { formatPokemonHeight, formatPokemonWeight } from './pokemon/format';
import { resolveCurrentMemberDex } from './pokemon/pcCurrentForm';
import { listRegisteredPokemon, searchRegisteredPokemonList } from './pokemon/registeredPokedexSearch';
import { pokemonSpriteUrl } from './pokemon/sprites';
import { pokeballLabel } from './pokeball/labels';
import { GACHA_POKEBALLS, normalizePokeballType } from './pokeball/sprites';
import { formatRegisterDate } from './format/registerDate';
import { PC_PAGE_SIZE_OPTIONS, POKEDEX_PAGE_SIZE_OPTIONS } from './ui/gridPageSizes';
import { COMPETITIVE_MATCH_ENABLED, FRIEND_MATCH_ENABLED } from './config/featureFlags';
import { buildPcGridData } from './pc/buildGridData';
import { buildPokedexGridData } from './pokedex/buildGridData';
import { INTRO_DIALOGUE_BEATS, speakerLabel } from './intro/dialogueScript';
import { GAME_RULES } from './game/rules';
import { PROFESSOR, RIVAL } from './game/characters';
import type { PokemonDto, PcLineDto, PokedexEntryDto } from '../services/types/pokemon';

function species(number: number, name: string, extra: Partial<PokemonDto> = {}): PokemonDto {
  return {
    id: String(number),
    number,
    name,
    primaryType: 'GRASS',
    secondaryType: 'POISON',
    generation: 1,
    color: 'GREEN',
    heightM: 0.7,
    weightKg: 6.9,
    rarity: 'COMMON',
    evolutionStage: 'BASE',
    evolutionLevel: 16,
    evolutionLine: { key: 1, rarity: 'COMMON', members: [1, 2, 3] },
    ...extra,
  };
}

describe('regras de cliente (auth, labels, grelhas, intro)', () => {
  describe('password e username', () => {
    it('rejeita senha curta ou sem maiúscula/especial e detecta username derivado do e-mail', () => {
      expect(getPasswordPolicyError('short')).toContain(String(PASSWORD_MIN_LENGTH));
      expect(getPasswordPolicyError('abcdefghij')).toMatch(/maiúscula/);
      expect(getPasswordPolicyError('Abcdefgh!1')).toBeUndefined();
      expect(usernameConflictsWithEmail('ash.ketchum', 'ash.ketchum@pallete.com')).toBe(true);
      expect(usernameConflictsWithEmail('ASHKETCHUM99', 'ash.ketchum@pallete.com')).toBe(true);
      expect(usernameConflictsWithEmail('trainerRed', 'ash.ketchum@pallete.com')).toBe(false);
      expect(usernameConflictsWithEmail('  ', 'a@b.com')).toBe(false);
      expect(USERNAME_FROM_EMAIL_MESSAGE).toMatch(/e-mail/i);
    });
  });

  describe('labels, medidas e sprites', () => {
    it('traduz tipos/raridade/cor/estágio e formata altura, peso, data e bolas', () => {
      expect(pokemonTypeLabel('FIRE')).toBe('Fogo');
      expect(pokemonTypeLabel('UNKNOWN_TYPE')).toBe('UNKNOWN TYPE');
      expect(pokemonRarityLabel('LEGENDARY')).toBe('Lendário');
      expect(pokemonColorLabel(null)).toBe('—');
      expect(pokemonColorLabel('YELLOW')).toBe('Amarelo');
      expect(pokemonEvolutionStageLabel(null)).toBe('—');
      expect(pokemonEvolutionStageLabel('FIRST_STAGE')).toBe('1ª evolução');
      expect(POKEMON_MYSTERY_LABEL).toBe('???');

      expect(formatPokemonHeight(null)).toBe('—');
      expect(formatPokemonWeight(null)).toBe('—');
      expect(formatPokemonHeight(1.2)).toMatch(/m$/);
      expect(formatPokemonWeight(6.9)).toMatch(/kg$/);

      expect(formatRegisterDate(undefined)).toBeNull();
      expect(formatRegisterDate('not-a-date')).toBeNull();
      expect(formatRegisterDate('2026-10-22T12:00:00Z')).toMatch(/2026/);

      expect(pokeballLabel('POKEBALL')).toBe('Poké Bola');
      expect(pokeballLabel('POKE_BALL')).toBe('Poké Bola');
      expect(pokeballLabel('GREAT_BALL')).toBe('Great Ball');
      expect(pokeballLabel('CUSTOM_BALL')).toBe('CUSTOM BALL');
      expect(normalizePokeballType('POKEBALL')).toBe('POKE_BALL');
      expect(normalizePokeballType('NOPE')).toBeNull();
      expect(GACHA_POKEBALLS).toHaveLength(5);
      expect(pokemonSpriteUrl(25)).toBe('/sprits/default/25.png');
      expect(pokemonSpriteUrl(25, 'shine')).toBe('/sprits/shine/25.png');
    });
  });

  describe('Pokédex, PC e pesquisa', () => {
    it('resolve a forma atual, pesquisa registados e monta as grelhas', () => {
      const members = [1, 2, 3];
      const levels = new Map<number, number | null>([
        [1, 1],
        [2, 16],
        [3, 32],
      ]);
      expect(resolveCurrentMemberDex([], 50, levels)).toBe(0);
      expect(resolveCurrentMemberDex(members, 1, levels)).toBe(1);
      expect(resolveCurrentMemberDex(members, 16, levels)).toBe(2);
      expect(resolveCurrentMemberDex(members, 40, levels)).toBe(3);

      const list = [species(1, 'Bulbasaur'), species(25, 'Pikachu')];
      expect(searchRegisteredPokemonList(list, '')).toHaveLength(2);
      expect(searchRegisteredPokemonList(list, 'pika').map((p) => p.number)).toEqual([25]);
      expect(searchRegisteredPokemonList(list, '#1').map((p) => p.number)).toEqual([1]);
      expect(listRegisteredPokemon(list, 1)).toHaveLength(1);

      const pcLine: PcLineDto = {
        evolutionLineKey: 1,
        members,
        rarity: 'COMMON',
        level: 20,
        totalXp: 0,
        xpToNextLevel: 50,
        xpForCurrentStep: 50,
        timesObtained: 1,
        claimedMilestones: [],
        pendingMilestones: [],
      };
      const byDex = new Map([[2, species(2, 'Ivysaur', { evolutionStage: 'FIRST_STAGE' })]]);
      const pc = buildPcGridData([pcLine], byDex, levels);
      expect(pc.gridItems[0]).toMatchObject({ dex: 2, name: 'Ivysaur', footer: 'Lv. 20' });

      const entries: PokedexEntryDto[] = [
        { pokemon: species(1, 'Bulbasaur'), registeredInUserPokedex: true },
        { pokemon: species(4, 'Charmander'), registeredInUserPokedex: false },
      ];
      const dex = buildPokedexGridData(entries);
      expect(dex.gridItems[0].name).toBe('Bulbasaur');
      expect(dex.gridItems[1].name).toBe(POKEMON_MYSTERY_LABEL);
      expect(POKEDEX_PAGE_SIZE_OPTIONS).toEqual([25, 50, 75, 100]);
      expect(PC_PAGE_SIZE_OPTIONS[0]).toBe(20);
      expect(FRIEND_MATCH_ENABLED).toBe(true);
      expect(COMPETITIVE_MATCH_ENABLED).toBe(true);
    });
  });

  describe('intro e regras do jogo', () => {
    it('expõe beats, personagens e o texto das regras', () => {
      expect(INTRO_DIALOGUE_BEATS.length).toBeGreaterThan(3);
      expect(speakerLabel('professor', 'Ash')).toBe(PROFESSOR.shortName);
      expect(speakerLabel('rival', 'Ash')).toBe(RIVAL.shortName);
      expect(speakerLabel('player', 'Ash')).toBe('Ash');
      expect(GAME_RULES).toHaveLength(6);
      expect(RIVAL.sprite).toMatch(/rival/);
    });
  });
});
