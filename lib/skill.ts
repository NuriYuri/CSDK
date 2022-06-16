import { CyclicDeserializationContext } from './data/cyclicSerialization';
import { ReferencingArray } from './data/referencing';

export type Skill<T> = {
  id: string;
  data: T;
};

type DataWithSkills = { skills: Skill<unknown>[] };

/**
 * Remove a skill from the creature
 * @param creature creature to get a skill removed (will modify the object!)
 * @param id id of the skill to remove
 */
export const removeSkill = (creature: DataWithSkills, id: string) => {
  creature.skills = creature.skills.filter((skill) => skill.id !== id);
};

/** Test if the creature has a skill */
export const hasSkill = (creature: DataWithSkills, id: string) => creature.skills.some((skill) => skill.id === id);

/**
 * Add a skill to the creature
 * @note It's not adding the skill if there's already a skill of the same id in the states array
 */
export const addSkill = <T>(creature: DataWithSkills, skill: Skill<T>) => {
  if (hasSkill(creature, skill.id)) return;

  creature.skills = [...creature.skills, skill];
};

/** Get a skill from the creature, returns undefined if skill has not been found */
export const getSkill = <T>(creature: DataWithSkills, id: string): Skill<T> | undefined =>
  creature.skills.find((skill) => skill.id === id) as Skill<T>;

let SERIALIZE_SKILL_DATA = (skill: Skill<unknown>, referencingArray: ReferencingArray): unknown => skill.data;
let DESERIALIZE_SKILL_DATA = (data: unknown, deserializationContext: CyclicDeserializationContext) => data;

/**
 * Register the function that tells CSDK how to serialize the skill data
 *
 * @example registerSerializeSkillData((skill, referencingArray) => getReferenceId(skill.data))
 */
export const registerSerializeSkillData = <T, U>(serializer: (skill: Skill<T>, referencingArray: ReferencingArray) => U) => {
  SERIALIZE_SKILL_DATA = serializer;
};

/** Function that serialize the skill data */
export const serializeSkillData = (skill: Skill<unknown>, referencingArray: ReferencingArray) => SERIALIZE_SKILL_DATA(skill, referencingArray);

/**
 * Register the function that tells CSDK how to deserialize the skill data
 *
 * @example registerDeserializeSkillData((data, deserializationContext) => getObjectFromReferenceId(
 *   data,
 *   deserializationContext.serializedReferencingArray,
 * ) as SkillData);
 */
export const registerDeserializeSkillData = <T, U>(deserializer: (data: U, deserializationContext: CyclicDeserializationContext) => T) => {
  DESERIALIZE_SKILL_DATA = deserializer;
};

/** Function that deserialize the skill data */
export const deserializeSkillData = (data: unknown, deserializationContext: CyclicDeserializationContext) =>
  DESERIALIZE_SKILL_DATA(data, deserializationContext);
