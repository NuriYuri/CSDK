/**
 * State is a kind of anonymous structure. You need to define all your states and register their hooks in a proper file.
 *
 * Example:
 * ```ts
 * import { registerEffect } from './effect';
 * import { State } from './state';
 *
 * type Immunity = State<{ counter: number }, 'immunity'>;
 * // Registering effect allow the addState function to automatically add the effect to the creature
 * registerEffect<{ target: Creature<unknown>, state: Immunity }, 'immunity'>('states', 'immunity', {
 *   onCleanup: (effect) => !hasState(effect.data.target, 'immunity'),
 *   onDamageComputation: (effect, context) => {
 *     if (hasState(effect.data.target, 'immunity')) return preventEffect(context);
 *     return undefined;
 *   },
 * });
 * ```
 */

import { CyclicDeserializationContext } from './data/cyclicSerialization';
import { ReferencingArray } from './data/referencing';
import { createEffect, Effect, effectExist } from './effect';

export type State<T, U extends string> = {
  readonly type: U;
  data: T;
};

type DataWithStates = { states: State<unknown, string>[]; effects: Record<string, Effect<unknown, string>[]> };

/**
 * Remove a state from the creature
 * @param creature creature to get a state removed (will modify the object!)
 * @param type type of the state to remove
 */
export const removeState = <U extends string>(creature: DataWithStates, type: U) => {
  creature.states = creature.states.filter((state) => state.type !== type);
};

/** Test if the creature has a state */
export const hasState = <U extends string>(creature: DataWithStates, type: U) => creature.states.some((state) => state.type === type);

/**
 * Add a state to the creature
 * @note It's not adding the state if there's already a state of the same type in the states array
 */
export const addState = <T, U extends string>(creature: DataWithStates, state: State<T, U>) => {
  if (hasState(creature, state.type)) return;

  creature.states = [...creature.states, state];
  if (effectExist('states', state.type)) {
    creature.effects['states'] ||= [];
    creature.effects['states'].push(createEffect('states', { type: state.type, data: { creature, state } }));
  }
};

/** Get a state from the creature, returns undefined if state has not been found */
export const getState = <T, U extends string>(creature: DataWithStates, type: U): State<T, U> | undefined =>
  creature.states.find((state) => state.type === type) as State<T, U>;

let SERIALIZE_STATE_DATA = (state: State<unknown, string>, referencingArray: ReferencingArray): unknown => state.data;
let DESERIALIZE_STATE_DATA = (data: unknown, deserializationContext: CyclicDeserializationContext) => data;

/**
 * Register the function that tells CSDK how to serialize the state data
 *
 * @example registerSerializeStateData((state, referencingArray) => getReferenceId(state.data))
 */
export const registerSerializeStateData = <T, U extends string, V>(serializer: (state: State<T, U>, referencingArray: ReferencingArray) => V) => {
  SERIALIZE_STATE_DATA = serializer;
};

/** Function that serialize the state data */
export const serializeStateData = (state: State<unknown, string>, referencingArray: ReferencingArray) =>
  SERIALIZE_STATE_DATA(state, referencingArray);

/**
 * Register the function that tells CSDK how to deserialize the state data
 *
 * @example registerDeserializeStateData((data, deserializationContext) => getObjectFromReferenceId(
 *   data,
 *   deserializationContext.serializedReferencingArray,
 * ) as StateData);
 */
export const registerDeserializeStateData = <T, U>(deserializer: (data: U, deserializationContext: CyclicDeserializationContext) => T) => {
  DESERIALIZE_STATE_DATA = deserializer;
};

/** Function that deserialize the state data */
export const deserializeStateData = (data: unknown, deserializationContext: CyclicDeserializationContext) =>
  DESERIALIZE_STATE_DATA(data, deserializationContext);
