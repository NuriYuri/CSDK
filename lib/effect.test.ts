import { Creature } from './creature';
import {
  cleanupEffects,
  createEffect,
  deserializeEffect,
  Effect,
  EffectContext,
  effectExist,
  preventEffect,
  registerDeserializeEffect,
  registerEffect,
  registerSerializeEffect,
  serializeEffect,
  __getVoidEffectFunctions,
} from './effect';

describe('effect', () => {
  describe('preventEffect', () => {
    it('returns the right value and actually link the cancelReason to context', () => {
      const context: EffectContext<unknown> = {
        target: {
          id: 'creature',
          form: 'form',
          hp: 0,
          level: 0,
          exp: 0,
          states: [],
          skills: [],
          effects: {},
          data: undefined,
        },
        data: undefined,
      };
      const reason = jest.fn();
      expect(preventEffect(context, reason)).toEqual('prevent');
      expect(context.cancellationReason === reason).toBeTruthy();
    });
  });

  describe('registerEffect - createEffect', () => {
    it('creates an effect with void function if category does not exist', () => {
      const effect = createEffect('category', { type: 'test', data: 25 });
      expect(effect.effectFunctions === __getVoidEffectFunctions()).toBeTruthy();
      expect(effect.type).toEqual('test');
      expect(effect.data).toEqual(25);
    });

    it('creates an effect with void function if effect type is not defined', () => {
      registerEffect('category', 'test2', {});
      const effect = createEffect('category', { type: 'test', data: 25 });
      expect(effect.effectFunctions === __getVoidEffectFunctions()).toBeTruthy();
      expect(effect.type).toEqual('test');
      expect(effect.data).toEqual(25);
    });

    it('creates an effect with correct functions', () => {
      const onCleanup = jest.fn();
      registerEffect('category', 'test', { onCleanup });
      const effect = createEffect('category', { type: 'test', data: 25 });
      expect(effect.effectFunctions === __getVoidEffectFunctions()).toBeFalsy();
      expect(effect.effectFunctions.onCleanup === onCleanup).toBeTruthy();
      expect(effect.type).toEqual('test');
      expect(effect.data).toEqual(25);
    });
  });

  describe('effectExist', () => {
    it('returns false if the category does not exist', () => {
      expect(effectExist('undefinedCategory', 'test')).toEqual(false);
    });

    it('returns false if the effect type does not exist', () => {
      const onCleanup = jest.fn();
      registerEffect('category', 'test2', { onCleanup });
      expect(effectExist('category', 'test3')).toEqual(false);
    });

    it('returns true if the effect exists', () => {
      const onCleanup = jest.fn();
      registerEffect('category', 'test', { onCleanup });
      expect(effectExist('category', 'test')).toEqual(true);
    });
  });

  describe('cleanupEffects', () => {
    it('cleans an effect list properly', () => {
      registerEffect('category', 'nonCleanable', { onCleanup: () => false });
      registerEffect('category', 'cleanable', { onCleanup: () => true });
      const cleanableEffect = { type: 'cleanable', data: undefined };
      const nonCleanableEffect = { type: 'nonCleanable', data: undefined };
      const creature: Creature<unknown> = {
        id: 'creature',
        form: 'form',
        hp: 0,
        level: 0,
        exp: 0,
        states: [],
        skills: [],
        effects: {
          category1: [createEffect('category', cleanableEffect), createEffect('category', nonCleanableEffect)],
          category2: [createEffect('category', nonCleanableEffect), createEffect('category', cleanableEffect)],
        },
        data: undefined,
      };

      cleanupEffects(creature, false);
      expect(creature.effects).toEqual({
        category1: [createEffect('category', nonCleanableEffect)],
        category2: [createEffect('category', nonCleanableEffect)],
      });
    });

    it('calls onCleanup with the right arguments', () => {
      registerEffect('category', 'mapOnlyCleanable', { onCleanup: (_, isInBattle) => !isInBattle });
      registerEffect('category', 'battleCleanable', { onCleanup: (_, isInBattle) => isInBattle });
      const battleCleanable = { type: 'battleCleanable', data: undefined };
      const mapOnlyCleanable = { type: 'mapOnlyCleanable', data: undefined };
      const effectsVector = {
        category1: [createEffect('category', battleCleanable), createEffect('category', mapOnlyCleanable)],
        category2: [createEffect('category', mapOnlyCleanable), createEffect('category', battleCleanable)],
      };
      const creature: Creature<unknown> = {
        id: 'creature',
        form: 'form',
        hp: 0,
        level: 0,
        exp: 0,
        states: [],
        skills: [],
        effects: effectsVector,
        data: undefined,
      };

      cleanupEffects(creature, false);
      expect(creature.effects === effectsVector).toBeFalsy();
      expect(creature.effects).toEqual({
        category1: [createEffect('category', battleCleanable)],
        category2: [createEffect('category', battleCleanable)],
      });

      creature.effects = effectsVector;
      cleanupEffects(creature, true);
      expect(creature.effects === effectsVector).toBeFalsy();
      expect(creature.effects).toEqual({
        category1: [createEffect('category', mapOnlyCleanable)],
        category2: [createEffect('category', mapOnlyCleanable)],
      });
    });
  });

  describe('registerSerializeEffect - serializeEffect', () => {
    it('returns the effect without function if category has no serializer', () => {
      const dummyEffect = { type: 'effect', data: 99, effectFunctions: __getVoidEffectFunctions() };
      expect(serializeEffect('categoryWithNoSerializer', dummyEffect as unknown as Effect<unknown, string>, [])).toEqual({
        type: 'effect',
        data: 99,
      });
    });

    it('returns the effect without function if type has no serializer', () => {
      registerSerializeEffect('category', 'test', (serializedEffect) => ({ ...serializedEffect, data: !effect.data }));
      const effect = { type: 'noSerializer', data: true, effectFunctions: __getVoidEffectFunctions() };
      expect(serializeEffect('category', effect, [])).toEqual({ type: 'noSerializer', data: true });
    });

    it('serializes the effect if type and category has serializer', () => {
      registerSerializeEffect('category', 'serializable', (serializedEffect) => ({ type: serializedEffect.type, data: 0 }));
      const effect = { type: 'serializable', data: { value: 99 }, effectFunctions: __getVoidEffectFunctions() };
      expect(serializeEffect('category', effect, [])).toEqual({ type: effect.type, data: 0 });
    });
  });

  describe('registerDeserializeEffect - deserializeEffect', () => {
    const context = { serializedReferencingArray: [], deserializedReferencingArray: [] };
    it('returns the effect if category has no deserializer', () => {
      const effect = { type: 'noCategoryDeserializer', data: true };
      expect(deserializeEffect('categoryWithNoDeserializer', effect, context)).toEqual({
        type: effect.type,
        effectFunctions: __getVoidEffectFunctions(),
        data: true,
      });
    });

    it('returns the effect if type has no deserializer', () => {
      registerDeserializeEffect('category', 'test', (deserializedEffect) => ({ ...deserializedEffect, data: !effect.data }));
      const effect = { type: 'noDeserializer', data: true };
      expect(deserializeEffect('category', effect, context)).toEqual({
        type: effect.type,
        effectFunctions: __getVoidEffectFunctions(),
        data: true,
      });
    });

    it('serializes the effect if type and category has deserializer', () => {
      registerDeserializeEffect('category', 'deserializable', (deserializedEffect) => ({ ...deserializedEffect, data: { value: 99 } }));
      const effect = { type: 'deserializable', data: 0 };
      expect(deserializeEffect('category', effect, context)).toEqual({
        type: effect.type,
        effectFunctions: __getVoidEffectFunctions(),
        data: { value: 99 },
      });
    });
  });
});
