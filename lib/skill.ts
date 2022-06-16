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
