import { CyclicDeserializationContext, ReferencingArray } from './data';
import { deserializeEffect, Effect, serializeEffect } from './effect';
import { deserializeSkillData, serializeSkillData, Skill } from './skill';
import { deserializeStateData, serializeStateData, State } from './state';

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

let SERIALIZE_CREATURE_DATA = (creature: Creature<unknown>, referencingArray: ReferencingArray): unknown => creature.data;
let DESERIALIZE_CREATURE_DATA = (data: unknown, context: CyclicDeserializationContext): unknown => data;

/** Register the data serialization function for a creature */
export const registerSerializeCreatureData = <T, U>(serializer: (creature: Creature<T>, referencingArray: ReferencingArray) => U) => {
  SERIALIZE_CREATURE_DATA = serializer;
};

/** Serialize a creature so it can be saved */
export const serializeCreature = (creature: Creature<unknown>, referencingArray: ReferencingArray): Creature<unknown> => ({
  ...creature,
  states: creature.states.map((state) => ({ ...state, data: serializeStateData(state, referencingArray) })),
  skills: creature.skills.map((skill) => ({ ...skill, data: serializeSkillData(skill, referencingArray) })),
  effects: Object.fromEntries(
    Object.entries(creature.effects).map(([category, list]) => [category, list.map((effect) => serializeEffect(category, effect, referencingArray))]),
  ),
  data: SERIALIZE_CREATURE_DATA(creature, referencingArray),
});

/** Register the data deserialization function for a creature */
export const registerDeserializeCreatureData = <T, U>(deserializer: (data: T, context: CyclicDeserializationContext) => U) => {
  DESERIALIZE_CREATURE_DATA = deserializer;
};

/** Deserialize a creature so it can be restored */
export const deserializeCreature = (creature: Creature<unknown>, context: CyclicDeserializationContext): Creature<unknown> => ({
  ...creature,
  states: creature.states.map((state) => ({ ...state, data: deserializeStateData(state, context) })),
  skills: creature.skills.map((skill) => ({ ...skill, data: deserializeSkillData(skill.data, context) })),
  effects: Object.fromEntries(
    Object.entries(creature.effects).map(([category, list]) => [category, list.map((effect) => deserializeEffect(category, effect, context))]),
  ),
  data: DESERIALIZE_CREATURE_DATA(creature.data, context),
});
