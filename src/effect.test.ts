import { Creature } from './creature';
import { cleanupEffects, createEffect, EffectContext, preventEffect, registerEffect, __getVoidEffectFunctions } from './effect';

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
});
