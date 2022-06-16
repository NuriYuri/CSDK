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
