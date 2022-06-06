/**
 * State is a kind of anonymous structure. You need to define all your states and register their hooks in a proper file.
 *
 * Example:
 * ```ts
 * import { registerEffect, createEffect } from './effect';
 * import { State } from './state';
 *
 * type Immunity = State<{ counter: number }, 'immunity'>;
 * registerEffect('immunity', ) TODO: voir parce que c'est pas claire!!
 * ```
 */

export type State<T, U extends string> = {
  readonly type: U;
  data: T;
};

type DataWithStates = { states: State<unknown, string>[] };

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
};

/** Get a state from the creature, returns undefined if state has not been found */
export const getState = <T, U extends string>(creature: DataWithStates, type: U): State<T, U> | undefined =>
  creature.states.find((state) => state.type === type) as State<T, U>;
