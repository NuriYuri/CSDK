import { Creature } from './creature';
import { addState, getState, hasState, removeState } from './state';

describe('state', () => {
  const creature: Creature<undefined> = {
    id: 'creature',
    form: 'form',
    hp: 0,
    level: 0,
    exp: 0,
    states: [],
    skills: [],
    effects: {},
    data: undefined,
  };

  describe('removeState', () => {
    it('works if the creature has not the state', () => {
      removeState(creature, 'test');
      expect(creature.states).toEqual([]);
    });

    it('removes the state properly', () => {
      const creatureWithStates: Creature<undefined> = {
        ...creature,
        states: [
          { type: 'test', data: undefined },
          { type: 'test2', data: undefined },
        ],
      };
      removeState(creatureWithStates, 'test');
      expect(creatureWithStates.states).toEqual([{ type: 'test2', data: undefined }]);
    });
  });

  describe('hasState', () => {
    it('returns true if the creature has the state', () => {
      const creatureWithStates: Creature<undefined> = {
        ...creature,
        states: [{ type: 'test', data: undefined }],
      };

      expect(hasState(creatureWithStates, 'test')).toEqual(true);
    });

    it('returns false if the creature does not have the state', () => {
      expect(hasState(creature, 'test')).toEqual(false);
    });
  });

  describe('addState', () => {
    it('adds the state properly and only once', () => {
      const workingCreature = { ...creature };

      addState(workingCreature, { type: 'test', data: 0 });
      expect(workingCreature).toEqual({ ...creature, states: [{ type: 'test', data: 0 }] });

      addState(workingCreature, { type: 'test', data: 1 });
      expect(workingCreature).toEqual({ ...creature, states: [{ type: 'test', data: 0 }] });
    });
  });

  describe('getState', () => {
    it('returns undefined if the creature does not have the state', () => {
      expect(getState(creature, 'test')).toBeUndefined();
    });

    it('returns the proper state if the creature has the state', () => {
      const creatureWithStates: Creature<undefined> = {
        ...creature,
        states: [{ type: 'test', data: undefined }],
      };
      expect(getState(creatureWithStates, 'test')).toEqual({ type: 'test', data: undefined });
    });
  });
});
