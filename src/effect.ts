import { Creature } from './creature';
import { Skill } from './skill';

/**
 * Context object passed to the effect function, contains all the relevant data
 */
export type EffectContext<V> = {
  target: Creature<unknown>;
  data: V;
  user?: Creature<unknown>;
  skill?: Skill<unknown>;
  cancellationReason?: (sceneState: unknown) => unknown;
};

/**
 * Possible return for an effect function
 * - `'passthrough'` means the effect will execute regardless of prevention
 * - `'prevent'` means the effect will not execute
 * - `undefined` is the default return
 */
type EffectFunctionReturnType = 'passthrough' | 'prevent' | undefined;

/**
 * Function to call to help with returning prevention with reason
 * @example
 * const onDamage = (effect: CustomEffect, context: EffectContext<number>) => {
 *  if (context.data <= context.target.hp - 1) return undefined;
 *
 *  return preventEffect(context, (sceneState) => ({ ...sceneState, messageToDisplay: 'blablabla', afterMessage: undefined }))
 * }
 */
export const preventEffect = (context: EffectContext<unknown>, reason: typeof context['cancellationReason']): 'prevent' => {
  context.cancellationReason = reason;
  return 'prevent';
};

type EffectFunctions<T, U extends string> = {
  readonly onDamage: (effect: Effect<T, U>, user: string, target: string, damage: number) => EffectFunctionReturnType;
  readonly onStatus: (effect: Effect<T, U>, user: string, target: string, status: string) => EffectFunctionReturnType;
};
export type PartialEffectFunctions<T, U extends string> = Partial<EffectFunctions<T, U>>;
export type GenericEffectFunctions = EffectFunctions<unknown, string>;

export type Effect<T, U extends string> = {
  readonly type: U;
  data: T;
  readonly effectFunctions: EffectFunctions<T, U>;
};

const DEFINED_EFFECTS: Record<string, Record<string, GenericEffectFunctions>> = {};
const VOID_EFFECT: GenericEffectFunctions = {
  onDamage: () => null,
  onStatus: () => null,
};

/**
 * Register a new effect so system can create one with ease
 * @example
 * registerEffect('state', 'immunity', { onDamage: (effect: ImmunityEffect, context: HpDownContext) => 'prevent' })
 */
export const registerEffect = <T, U extends string>(category: string, type: U, effectFunctions: PartialEffectFunctions<T, U>) => {
  DEFINED_EFFECTS[category] ||= {};
  DEFINED_EFFECTS[category][type] = { ...VOID_EFFECT, effectFunctions } as GenericEffectFunctions;
};

/**
 * Create a new effect of a specific kind with the right functions to call
 * @example
 * const newEffect = createEffect('state', { type: 'immunity', data: creature });
 */
export const createEffect = <T, U extends string>(category: string, effect: Omit<Effect<T, U>, 'effectFunction'>): Effect<T, U> => {
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

// TODO: define all the kind of possible effect happening on battle
// TODO: add tests
