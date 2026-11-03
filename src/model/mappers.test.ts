import { mapPcLine, mapPcLineList, mapPokedexEntry, mapPokedexEntryList, mapPokemon } from './mappers/pokemon';
import { mapGameHistoryEntry, mapGameHistoryList, mapGachaDrawResult, mapTrainingTeam } from './mappers/game';
import { mapPokeballInventory, mapProfileMe } from './mappers/profile';
import type { PokemonDto, PcLineDto, PokedexEntryDto } from '../services/types/pokemon';
import type { GameHistoryEntryDto, PokeballDrawResponse, TrainingTeamResponse } from '../services/types/game';
import type { ProfileMeResponse, ProfilePokeballPayload } from '../services/types/profile';

const pokemonDto: PokemonDto = {
  id: '25',
  number: 25,
  name: 'Pikachu',
  primaryType: 'ELECTRIC',
  secondaryType: null,
  generation: 1,
  color: 'YELLOW',
  heightM: 0.4,
  weightKg: 6,
  rarity: 'COMMON',
  evolutionStage: 'BASE',
  evolutionLevel: null,
  evolutionLine: { key: 25, rarity: 'COMMON', members: [172, 25, 26] },
};

describe('mappers de domínio', () => {
  it('copia Pokémon, PC, histórico, gacha, time de treino e perfil sem partilhar arrays', () => {
    const pokemon = mapPokemon(pokemonDto);
    expect(pokemon.evolutionLine?.members).toEqual([172, 25, 26]);
    expect(pokemon.evolutionLine?.members).not.toBe(pokemonDto.evolutionLine?.members);
    expect(mapPokemon({ ...pokemonDto, evolutionLine: null }).evolutionLine).toBeNull();

    const lineDto: PcLineDto = {
      evolutionLineKey: 25,
      members: [172, 25, 26],
      rarity: 'COMMON',
      level: 3,
      totalXp: 150,
      xpToNextLevel: 100,
      xpForCurrentStep: 100,
      timesObtained: 2,
      claimedMilestones: [25],
      pendingMilestones: [],
    };
    const line = mapPcLine(lineDto);
    expect(line.members).not.toBe(lineDto.members);
    expect(mapPcLineList([lineDto])).toHaveLength(1);

    const entryDto: PokedexEntryDto = { pokemon: pokemonDto, registeredInUserPokedex: true };
    expect(mapPokedexEntry(entryDto).registeredInUserPokedex).toBe(true);
    expect(mapPokedexEntryList([entryDto])[0].pokemon.number).toBe(25);

    const historyDto: GameHistoryEntryDto = {
      id: 'g1',
      gameMode: 'BOT',
      playedAt: '2026-01-01T00:00:00Z',
      opponentName: 'Bot',
      players: [{ slot: 1, profileId: 'p1', username: 'ash', correctGuesses: 6, result: 'WIN' }],
    };
    expect(mapGameHistoryEntry(historyDto).players[0].username).toBe('ash');
    expect(mapGameHistoryList([historyDto])).toHaveLength(1);

    const gacha: PokeballDrawResponse = {
      pokeballType: 'POKE_BALL',
      rolledRarity: 'COMMON',
      pokemon: pokemonDto,
      newInventoryLine: false,
      timesObtainedOnLine: 2,
    };
    expect(mapGachaDrawResult(gacha).pokemon.name).toBe('Pikachu');

    const team: TrainingTeamResponse = {
      slots: [
        { slot: 1, evolutionLineKey: 25, line: lineDto },
        { slot: 2, evolutionLineKey: null, line: null },
      ],
    };
    expect(mapTrainingTeam(team).slots[0].line?.level).toBe(3);
    expect(mapTrainingTeam(team).slots[1].line).toBeNull();

    const me: ProfileMeResponse = {
      profileId: 'p1',
      userId: 'u1',
      favoritePokemonId: '25',
      favoritePokemonName: 'Pikachu',
      registeredPokedexCount: 12,
    };
    expect(mapProfileMe(me).registeredPokedexCount).toBe(12);

    const balls: ProfilePokeballPayload = {
      pokeballFragments: 3,
      fragmentsPerPokeBall: 10,
      items: [{ pokeballType: 'POKE_BALL', quantity: 2 }],
    };
    expect(mapPokeballInventory(balls).items[0].quantity).toBe(2);
    expect(mapPokeballInventory(balls).items).not.toBe(balls.items);
  });
});
