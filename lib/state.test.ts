import { Creature } from './creature';
import { CyclicDeserializationContext } from './data/cyclicSerialization';
import { registerEffect, __getVoidEffectFunctions } from './effect';
import {
  addState,
  deserializeStateData,
  getState,
  hasState,
  registerDeserializeStateData,
  registerSerializeStateData,
  removeState,
  serializeStateData,
} from './state';

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

    it('adds the state and effect if state has effect', () => {
      registerEffect('states', 'stateWithEffect', {});

      const workingCreature = { ...creature };
      const expectations = {
        ...creature,
        states: [{ type: 'stateWithEffect', data: 0 }],
        effects: {
          states: [
            { type: 'stateWithEffect', data: { creature, state: { type: 'stateWithEffect', data: 0 } }, effectFunctions: __getVoidEffectFunctions() },
          ],
        },
      };
      expectations.effects.states[0].data.creature = expectations;
      addState(workingCreature, { type: 'stateWithEffect', data: 0 });
      expect(workingCreature).toEqual(expectations);
      addState(workingCreature, { type: 'stateWithEffect', data: 0 });
      expect(workingCreature).toEqual(expectations);
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

  describe('registerSerializeStateData - serializeStateData', () => {
    it('just map data to data by default', () => {
      expect(serializeStateData({ type: 'state', data: 5 }, [])).toEqual(5);
      expect(serializeStateData({ type: 'state', data: { complex: '33' } }, [])).toEqual({ complex: '33' });
    });

    it('register and call the serialize function properly', () => {
      const serializeData = jest.fn();
      serializeData.mockReturnValueOnce('some dummy data');
      registerSerializeStateData(serializeData);
      expect(serializeStateData({ type: 'state', data: undefined }, [])).toEqual('some dummy data');
      expect(serializeData).toHaveBeenCalledWith({ type: 'state', data: undefined }, []);

      serializeData.mockReturnValueOnce('some other data');
      expect(serializeStateData({ type: 'state2', data: 33 }, [null])).toEqual('some other data');
      expect(serializeData).toHaveBeenCalledWith({ type: 'state2', data: 33 }, [null]);
    });
  });

  describe('registerDeserializeStateData - deserializeStateData', () => {
    const deserializationContext: CyclicDeserializationContext = {
      serializedReferencingArray: [],
      deserializedReferencingArray: [],
    };

    it('just map data to data by default', () => {
      expect(deserializeStateData({ type: 'test', data: 5 }, deserializationContext)).toEqual(5);
      expect(deserializeStateData({ type: 'test', data: { complex: '33' } }, deserializationContext)).toEqual({ complex: '33' });
    });

    it('register and call the deserialize function properly', () => {
      const deserializeData = jest.fn();
      deserializeData.mockReturnValueOnce('some dummy data');
      registerDeserializeStateData(deserializeData);
      expect(deserializeStateData({ type: 'test', data: 0 }, deserializationContext)).toEqual('some dummy data');
      expect(deserializeData).toHaveBeenCalledWith({ type: 'test', data: 0 }, deserializationContext);

      deserializeData.mockReturnValueOnce('some other data');
      expect(deserializeStateData({ type: 'test', data: { test: 22 } }, deserializationContext)).toEqual('some other data');
      expect(deserializeData).toHaveBeenCalledWith({ type: 'test', data: { test: 22 } }, deserializationContext);
    });
  });
});
