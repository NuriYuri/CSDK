import { Creature } from './creature';
import { addSkill, getSkill, hasSkill, removeSkill } from './skill';

describe('skill', () => {
  const creature: Creature<undefined> = {
    id: 'creature',
    form: 'form',
    hp: 0,
    level: 0,
    exp: 0,
    states: [],
    skills: [],
    effects: {},
    data: undefined,
  };

  describe('removeSkill', () => {
    it('works if the creature has not the skill', () => {
      removeSkill(creature, 'test');
      expect(creature.skills).toEqual([]);
    });

    it('removes the skill properly', () => {
      const creatureWithSkills: Creature<undefined> = {
        ...creature,
        skills: [
          { id: 'test', data: undefined },
          { id: 'test2', data: undefined },
        ],
      };
      removeSkill(creatureWithSkills, 'test');
      expect(creatureWithSkills.skills).toEqual([{ id: 'test2', data: undefined }]);
    });
  });

  describe('hasSkill', () => {
    it('returns true if the creature has the skill', () => {
      const creatureWithSkills: Creature<undefined> = {
        ...creature,
        skills: [{ id: 'test', data: undefined }],
      };

      expect(hasSkill(creatureWithSkills, 'test')).toEqual(true);
    });

    it('returns false if the creature does not have the skill', () => {
      expect(hasSkill(creature, 'test')).toEqual(false);
    });
  });

  describe('addSkill', () => {
    it('adds the skill properly and only once', () => {
      const workingCreature = { ...creature };

      addSkill(workingCreature, { id: 'test', data: 0 });
      expect(workingCreature).toEqual({ ...creature, skills: [{ id: 'test', data: 0 }] });

      addSkill(workingCreature, { id: 'test', data: 1 });
      expect(workingCreature).toEqual({ ...creature, skills: [{ id: 'test', data: 0 }] });
    });
  });

  describe('getSkill', () => {
    it('returns undefined if the creature does not have the skill', () => {
      expect(getSkill(creature, 'test')).toBeUndefined();
    });

    it('returns the proper skill if the creature has the skill', () => {
      const creatureWithSkills: Creature<undefined> = {
        ...creature,
        skills: [{ id: 'test', data: undefined }],
      };
      expect(getSkill(creatureWithSkills, 'test')).toEqual({ id: 'test', data: undefined });
    });
  });
});
