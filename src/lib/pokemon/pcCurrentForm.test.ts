import { resolveCurrentMemberDex } from './pcCurrentForm';

function levels(entries: Array<[number, number | null]>): Map<number, number | null> {
  return new Map(entries);
}

describe('resolveCurrentMemberDex', () => {
  it('keeps base form below evolution threshold', () => {
    const members = [656, 657, 658];
    const map = levels([
      [656, 16],
      [657, 36],
      [658, null],
    ]);

    expect(resolveCurrentMemberDex(members, 15, map)).toBe(656);
  });

  it('evolves Froakie into Frogadier at level 16', () => {
    const members = [656, 657, 658];
    const map = levels([
      [656, 16],
      [657, 36],
      [658, null],
    ]);

    expect(resolveCurrentMemberDex(members, 16, map)).toBe(657);
  });

  it('evolves Frogadier into Greninja at level 36', () => {
    const members = [656, 657, 658];
    const map = levels([
      [656, 16],
      [657, 36],
      [658, null],
    ]);

    expect(resolveCurrentMemberDex(members, 36, map)).toBe(658);
  });

  it('matches Bulbasaur line thresholds from backend', () => {
    const members = [1, 2, 3];
    const map = levels([
      [1, 16],
      [2, 32],
      [3, null],
    ]);

    expect(resolveCurrentMemberDex(members, 1, map)).toBe(1);
    expect(resolveCurrentMemberDex(members, 16, map)).toBe(2);
    expect(resolveCurrentMemberDex(members, 32, map)).toBe(3);
  });
});
