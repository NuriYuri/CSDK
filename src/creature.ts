import { Skill } from './skill';
import { State } from './state';

export type Creature<T> = {
  readonly id: string;
  readonly form: string;
  hp: number;
  states: State<unknown, string>[];
  skills: Skill<unknown>[];
  level: number;
  exp: number;
  data: T;
};

// TODO: add living stats data (increase/decrease) CSDK will not reset states out of battle because this is stupid
// TODO: add effect data (same as stats but we live the freedom of the effect to remove themselves at the end of battle)
