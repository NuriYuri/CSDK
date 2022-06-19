import type { Creature } from './creature';
import { CyclicDeserializationContext, ReferencingArray } from './data';
import type { Element } from './element';
import type { ItemBase } from './item';
import type { Skill } from './skill';
import type { State } from './state';
import type { StateMutationFunction } from './stateMutationQueue';

export type Effect<T, U extends string> = {
  readonly type: U;
  data: T;
  readonly effectFunctions: EffectFunctions<T, U>;
};

/**
 * Context object passed to the effect function, contains all the relevant data
 */
export type EffectContext<V> = {
  readonly target: Creature<unknown>;
  readonly data: V;
  readonly user?: Creature<unknown>;
  readonly skill?: Skill<unknown>;
  cancellationReason?: StateMutationFunction<unknown>;
};

/**
 * Possible return for an effect function
 * - `'passthrough'` means the effect will execute regardless of prevention
 * - `'prevent'` means the effect will not execute
 * - `undefined` is the default return
 */
type EffectFunctionReturnType = 'passthrough' | 'prevent' | undefined;
type NoisyEffectFunctionReturnType = StateMutationFunction<unknown> | undefined;

/**
 * Function to call to help with returning prevention with reason
 * @example
 * const onDamage = (effect: CustomEffect, context: EffectContext<number>) => {
 *  if (context.data <= context.target.hp - 1) return undefined;
 *
 *  return preventEffect(context, (sceneState) => ({ ...sceneState, messageToDisplay: 'blablabla', afterMessage: undefined }))
 * }
 */
export const preventEffect = (context: EffectContext<unknown>, reason?: StateMutationFunction<unknown>): 'prevent' => {
  context.cancellationReason = reason;
  return 'prevent';
};

type EffectFunctions<T, U extends string> = {
  readonly onGetStatModifier: (effect: Effect<T, U>, context: EffectContext<{ stat: string; modifier: number }>) => void;
  readonly onDamageComputation: (effect: Effect<T, U>, context: EffectContext<{ hp: number }>) => EffectFunctionReturnType;
  readonly onAfterDamageApplied: (effect: Effect<T, U>, context: EffectContext<{ hp: number }>) => NoisyEffectFunctionReturnType;
  readonly onCanApplyState: (effect: Effect<T, U>, context: EffectContext<{ state: State<unknown, string> }>) => EffectFunctionReturnType;
  readonly onStateApplied: (effect: Effect<T, U>, context: EffectContext<{ state: State<unknown, string> }>) => NoisyEffectFunctionReturnType;
  readonly onCanUseSkill: (effect: Effect<T, U>, context: EffectContext<undefined>) => EffectFunctionReturnType;
  readonly onGetSkillElements: (effect: Effect<T, U>, context: EffectContext<{ elements: Element[] }>) => void;
  readonly onGetCreatureElements: (effect: Effect<T, U>, context: EffectContext<{ elements: Element[] }>) => void;
  readonly onItemHeld: (effect: Effect<T, U>, context: EffectContext<{ item: ItemBase<unknown, string> }>) => NoisyEffectFunctionReturnType;
  readonly onItemDropped: (effect: Effect<T, U>, context: EffectContext<{ item: ItemBase<unknown, string> }>) => NoisyEffectFunctionReturnType;
  readonly onTurnEnd: (effect: Effect<T, U>, context: EffectContext<{ turnNumber: number }>) => NoisyEffectFunctionReturnType;
  readonly onCleanup: (effect: Effect<T, U>, isInBattle: boolean) => boolean;
};
export type PartialEffectFunctions<T, U extends string> = Partial<EffectFunctions<T, U>>;
export type GenericEffectFunctions = EffectFunctions<unknown, string>;

const DEFINED_EFFECTS: Record<string, Record<string, GenericEffectFunctions>> = {};
const VOID_EFFECT: GenericEffectFunctions = {
  onGetStatModifier: () => null,
  onDamageComputation: () => undefined,
  onAfterDamageApplied: () => undefined,
  onCanApplyState: () => undefined,
  onStateApplied: () => undefined,
  onCanUseSkill: () => undefined,
  onGetSkillElements: () => null,
  onGetCreatureElements: () => null,
  onItemHeld: () => undefined,
  onItemDropped: () => undefined,
  onTurnEnd: () => undefined,
  onCleanup: () => false,
};

// tslint:disable-next-line: variable-name
export const __getVoidEffectFunctions = () => VOID_EFFECT;

/**
 * Register a new effect so system can create one with ease
 * @example
 * registerEffect('state', 'immunity', { onDamageComputation: (effect: ImmunityEffect, context: HpDownContext) => { context.hp = 0 } });
 */
export const registerEffect = <T, U extends string>(category: string, type: U, effectFunctions: PartialEffectFunctions<T, U>) => {
  DEFINED_EFFECTS[category] ||= {};
  DEFINED_EFFECTS[category][type] = { ...VOID_EFFECT, ...effectFunctions } as GenericEffectFunctions;
};

/**
 * Test if an effect exists
 */
export const effectExist = (category: string, type: string) => {
  if (!DEFINED_EFFECTS[category]) return false;

  return DEFINED_EFFECTS[category][type] ? true : false;
};

/**
 * Create a new effect of a specific kind with the right functions to call
 * @example
 * const newEffect = createEffect('state', { type: 'immunity', data: creature });
 */
export const createEffect = <T, U extends string>(category: string, effect: Omit<Effect<T, U>, 'effectFunctions'>): Effect<T, U> => {
  if (!DEFINED_EFFECTS[category]) {
    return {
      ...effect,
      effectFunctions: VOID_EFFECT,
    };
  }

  return {
    ...effect,
    effectFunctions: DEFINED_EFFECTS[category][effect.type] ?? VOID_EFFECT,
  };
};

/**
 * Cleanup all the invalid/finished the effect from a creature
 */
export const cleanupEffects = (creature: Creature<unknown>, isInBattle: boolean) => {
  creature.effects = Object.fromEntries(
    Object.entries(creature.effects).map(([key, value]) => [key, value.filter((effect) => !effect.effectFunctions.onCleanup(effect, isInBattle))]),
  );
};

const SERIALIZE_EFFECT: Record<
  string,
  Record<string, (effect: Effect<unknown, string>, referencingArray: ReferencingArray) => Omit<Effect<unknown, string>, 'effectFunctions'>>
> = {};
const DESERIALIZE_EFFECT: Record<
  string,
  Record<
    string,
    (
      data: Omit<Effect<unknown, string>, 'effectFunctions'>,
      context: CyclicDeserializationContext,
    ) => Omit<Effect<unknown, string>, 'effectFunctions'>
  >
> = {};

/** Register the effect serialization function for an effect category & type */
export const registerSerializeEffect = <T, U extends string, V>(
  category: string,
  type: string,
  serializer: (effect: Effect<T, U>, referencingArray: ReferencingArray) => Omit<Effect<V, U>, 'effectFunctions'>,
) => {
  SERIALIZE_EFFECT[category] ||= {};
  SERIALIZE_EFFECT[category][type] = serializer;
};

/** Serialize an effect of a category */
export const serializeEffect = (
  category: string,
  effect: Effect<unknown, string>,
  referencingArray: ReferencingArray,
): Omit<Effect<unknown, string>, 'effectFunctions'> => {
  if (!SERIALIZE_EFFECT[category]) return { type: effect.type, data: effect.data };

  return SERIALIZE_EFFECT[category][effect.type]?.(effect, referencingArray) || { type: effect.type, data: effect.data };
};

/** Register the effect deserialization for an effect category & type */
export const registerDeserializeEffect = <T, U extends string, V>(
  category: string,
  type: string,
  deserializer: (data: Effect<V, U>, context: CyclicDeserializationContext) => Omit<Effect<T, U>, 'effectFunctions'>,
) => {
  DESERIALIZE_EFFECT[category] ||= {};
  DESERIALIZE_EFFECT[category][type] = deserializer;
};

/** Deserialize an effect of a category */
export const deserializeEffect = (
  category: string,
  data: Omit<Effect<unknown, string>, 'effectFunctions'>,
  context: CyclicDeserializationContext,
): Effect<unknown, string> => {
  if (!DESERIALIZE_EFFECT[category]) return { ...data, effectFunctions: VOID_EFFECT };

  return createEffect(category, DESERIALIZE_EFFECT[category][data.type]?.(data, context) || data);
};
