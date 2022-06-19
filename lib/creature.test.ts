const deserializeEffectMock: jest.MockedFunction<typeof deserializeEffect> = jest.fn();
const serializeEffectMock: jest.MockedFunction<typeof serializeEffect> = jest.fn();
const deserializeSkillDataMock: jest.MockedFunction<typeof deserializeSkillData> = jest.fn();
const serializeSkillDataMock: jest.MockedFunction<typeof serializeSkillData> = jest.fn();
const deserializeStateDataMock: jest.MockedFunction<typeof deserializeStateData> = jest.fn();
const serializeStateDataMock: jest.MockedFunction<typeof serializeStateData> = jest.fn();

import {
  computeStat,
  Creature,
  deserializeCreature,
  registerComputeStatFunction,
  registerDeserializeCreatureData,
  registerSerializeCreatureData,
  serializeCreature,
} from './creature';
import { deserializeEffect, GenericEffectFunctions, serializeEffect } from './effect';
import { deserializeSkillData, serializeSkillData } from './skill';
import { deserializeStateData, serializeStateData } from './state';

jest.mock('./effect', () => ({
  deserializeEffect: deserializeEffectMock,
  serializeEffect: serializeEffectMock,
}));

jest.mock('./skill', () => ({
  deserializeSkillData: deserializeSkillDataMock,
  serializeSkillData: serializeSkillDataMock,
}));

jest.mock('./state', () => ({
  deserializeStateData: deserializeStateDataMock,
  serializeStateData: serializeStateDataMock,
}));

describe('creature', () => {
  beforeEach(() => {
    deserializeEffectMock.mockReset();
    serializeEffectMock.mockReset();
    deserializeSkillDataMock.mockReset();
    serializeSkillDataMock.mockReset();
    deserializeStateDataMock.mockReset();
    serializeStateDataMock.mockReset();
  });

  describe('registerComputeStatFunction - computeStat', () => {
    it('returns 1 if no function has been registered', () => {
      expect(computeStat(undefined as unknown as Creature<unknown>, undefined as unknown as string)).toEqual(1);
    });

    it('calls the registered function', () => {
      const registeredFunction = jest.fn();
      registeredFunction.mockReturnValueOnce(58);
      registerComputeStatFunction(registeredFunction);

      expect(computeStat(55 as unknown as Creature<unknown>, '32')).toEqual(58);
      expect(registeredFunction).toHaveBeenCalledTimes(1);
      expect(registeredFunction).toHaveBeenCalledWith(55, '32');
    });
  });

  describe('registerSerializeCreatureData - serializeCreature', () => {
    it('copy the data over serialized object if not data serialization function has been registered', () => {
      const creature = {
        id: 'id',
        form: 'form',
        hp: 33,
        states: [],
        skills: [],
        level: 5,
        exp: 336,
        effects: {},
        data: 88989,
      };
      expect(serializeCreature(creature, [])).toEqual(creature);
    });

    it('mutates the data over serialized object if data serialization function has been registered', () => {
      const creature = {
        id: 'id',
        form: 'form',
        hp: 33,
        states: [],
        skills: [],
        level: 5,
        exp: 336,
        effects: {},
        data: 88989,
      };
      registerSerializeCreatureData((toSerialize: Creature<number>) => -toSerialize.data);
      expect(serializeCreature(creature, [])).toEqual({ ...creature, data: -88989 });
    });

    it('calls the serialize function from sub entities with right arguments', () => {
      serializeEffectMock.mockImplementation((_, e) => ({ type: e.type, data: e.data }));
      serializeSkillDataMock.mockImplementation((s) => s.data);
      serializeStateDataMock.mockImplementation((s) => s.data);
      const effectFunctions = {} as GenericEffectFunctions;
      const creature = {
        id: 'id',
        form: 'form',
        hp: 33,
        states: [
          { type: 'test', data: 0 },
          { type: 'test2', data: 1 },
        ],
        skills: [
          { id: 'test', data: 0 },
          { id: 'test2', data: 1 },
        ],
        level: 5,
        exp: 336,
        effects: {
          cat: [{ type: 'test', data: 0, effectFunctions }],
          cot: [
            { type: 'test2', data: 0, effectFunctions },
            { type: 'test3', data: 1, effectFunctions },
          ],
        },
        data: 88989,
      };
      registerSerializeCreatureData((toSerialize: Creature<number>) => -toSerialize.data);
      expect(serializeCreature(creature, ['ref'])).toEqual({
        ...creature,
        effects: {
          cat: [{ type: 'test', data: 0 }],
          cot: [
            { type: 'test2', data: 0 },
            { type: 'test3', data: 1 },
          ],
        },
        data: -88989,
      });
      expect(serializeEffectMock).toHaveBeenCalledTimes(3);
      expect(serializeEffectMock).toHaveBeenNthCalledWith(1, 'cat', { type: 'test', data: 0, effectFunctions }, ['ref']);
      expect(serializeEffectMock).toHaveBeenNthCalledWith(2, 'cot', { type: 'test2', data: 0, effectFunctions }, ['ref']);
      expect(serializeEffectMock).toHaveBeenNthCalledWith(3, 'cot', { type: 'test3', data: 1, effectFunctions }, ['ref']);
      expect(serializeSkillDataMock).toHaveBeenCalledTimes(2);
      expect(serializeSkillDataMock).toHaveBeenNthCalledWith(1, { id: 'test', data: 0 }, ['ref']);
      expect(serializeSkillDataMock).toHaveBeenNthCalledWith(2, { id: 'test2', data: 1 }, ['ref']);
      expect(serializeStateDataMock).toHaveBeenCalledTimes(2);
      expect(serializeStateDataMock).toHaveBeenNthCalledWith(1, { type: 'test', data: 0 }, ['ref']);
      expect(serializeStateDataMock).toHaveBeenNthCalledWith(2, { type: 'test2', data: 1 }, ['ref']);
    });
  });

  describe('registerDeserializeCreatureData - deserializeCreature', () => {
    const context = { serializedReferencingArray: [], deserializedReferencingArray: [] };
    it('copy the data over deserialized object if not data deserialization function has been registered', () => {
      const creature = {
        id: 'id',
        form: 'form',
        hp: 33,
        states: [],
        skills: [],
        level: 5,
        exp: 336,
        effects: {},
        data: 88989,
      };
      expect(deserializeCreature(creature, context)).toEqual(creature);
    });

    it('mutates the data over serialized object if data serialization function has been registered', () => {
      const creature = {
        id: 'id',
        form: 'form',
        hp: 33,
        states: [],
        skills: [],
        level: 5,
        exp: 336,
        effects: {},
        data: 88989,
      };
      registerDeserializeCreatureData((data: number) => -data);
      expect(deserializeCreature(creature, context)).toEqual({ ...creature, data: -88989 });
    });

    it('calls the serialize function from sub entities with right arguments', () => {
      const effectFunctions = {} as GenericEffectFunctions;
      deserializeEffectMock.mockImplementation((_, e) => ({ type: e.type, data: e.data, effectFunctions }));
      deserializeSkillDataMock.mockImplementation((s) => s);
      deserializeStateDataMock.mockImplementation((s) => s.data);
      const creature = {
        id: 'id',
        form: 'form',
        hp: 33,
        states: [
          { type: 'test', data: 0 },
          { type: 'test2', data: 1 },
        ],
        skills: [
          { id: 'test', data: 0 },
          { id: 'test2', data: 1 },
        ],
        level: 5,
        exp: 336,
        effects: {
          cat: [{ type: 'test', data: 0 }],
          cot: [
            { type: 'test2', data: 0 },
            { type: 'test3', data: 1 },
          ],
        },
        data: 88989,
      };
      registerDeserializeCreatureData((data: number) => -data);
      expect(deserializeCreature(creature, context)).toEqual({
        ...creature,
        effects: {
          cat: [{ type: 'test', data: 0, effectFunctions }],
          cot: [
            { type: 'test2', data: 0, effectFunctions },
            { type: 'test3', data: 1, effectFunctions },
          ],
        },
        data: -88989,
      });
      expect(deserializeEffectMock).toHaveBeenCalledTimes(3);
      expect(deserializeEffectMock).toHaveBeenNthCalledWith(1, 'cat', { type: 'test', data: 0 }, context);
      expect(deserializeEffectMock).toHaveBeenNthCalledWith(2, 'cot', { type: 'test2', data: 0 }, context);
      expect(deserializeEffectMock).toHaveBeenNthCalledWith(3, 'cot', { type: 'test3', data: 1 }, context);
      expect(deserializeSkillDataMock).toHaveBeenCalledTimes(2);
      expect(deserializeSkillDataMock).toHaveBeenNthCalledWith(1, 0, context);
      expect(deserializeSkillDataMock).toHaveBeenNthCalledWith(2, 1, context);
      expect(deserializeStateDataMock).toHaveBeenCalledTimes(2);
      expect(deserializeStateDataMock).toHaveBeenNthCalledWith(1, { type: 'test', data: 0 }, context);
      expect(deserializeStateDataMock).toHaveBeenNthCalledWith(2, { type: 'test2', data: 1 }, context);
    });
  });
});
