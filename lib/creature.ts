import type { Effect } from './effect';
import type { Skill } from './skill';
import type { State } from './state';

export type Creature<T> = {
  readonly id: string;
  readonly form: string;
  hp: number;
  states: State<unknown, string>[];
  skills: Skill<unknown>[];
  level: number;
  exp: number;
  effects: Record<string, Effect<unknown, string>[]>;
  data: T;
};

let COMPUTE_STAT_FUNCTION = <T>(creature: Creature<T>, stat: string) => 1;

export const registerComputeStatFunction = (func: typeof COMPUTE_STAT_FUNCTION) => {
  COMPUTE_STAT_FUNCTION = func;
};
export const computeStat = <T>(creature: Creature<T>, stat: string) => COMPUTE_STAT_FUNCTION(creature, stat);
