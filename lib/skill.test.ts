import { Creature } from './creature';
import { CyclicDeserializationContext } from './data/cyclicSerialization';
import {
  addSkill,
  deserializeSkillData,
  getSkill,
  hasSkill,
  registerDeserializeSkillData,
  registerSerializeSkillData,
  removeSkill,
  serializeSkillData,
  Skill,
} from './skill';

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

  describe('registerSerializeSkillData - serializeSkillData', () => {
    it('just map data to data by default', () => {
      expect(serializeSkillData({ id: 'skill', data: 5 }, [])).toEqual(5);
      expect(serializeSkillData({ id: 'skill', data: { complex: '33' } }, [])).toEqual({ complex: '33' });
    });

    it('register and call the serialize function properly', () => {
      const serializeData = jest.fn();
      serializeData.mockReturnValueOnce('some dummy data');
      registerSerializeSkillData(serializeData);
      expect(serializeSkillData({ id: 'skill', data: undefined }, [])).toEqual('some dummy data');
      expect(serializeData).toHaveBeenCalledWith({ id: 'skill', data: undefined }, []);

      serializeData.mockReturnValueOnce('some other data');
      expect(serializeSkillData({ id: 'skill2', data: 33 }, [null])).toEqual('some other data');
      expect(serializeData).toHaveBeenCalledWith({ id: 'skill2', data: 33 }, [null]);
    });
  });

  describe('registerDeserializeSkillData - deserializeSkillData', () => {
    const deserializationContext: CyclicDeserializationContext = {
      serializedReferencingArray: [],
      deserializedReferencingArray: [],
    };

    it('just map data to data by default', () => {
      expect(deserializeSkillData(5, deserializationContext)).toEqual(5);
      expect(deserializeSkillData({ complex: '33' }, deserializationContext)).toEqual({ complex: '33' });
    });

    it('register and call the deserialize function properly', () => {
      const deserializeData = jest.fn();
      deserializeData.mockReturnValueOnce('some dummy data');
      registerDeserializeSkillData(deserializeData);
      expect(deserializeSkillData(0, deserializationContext)).toEqual('some dummy data');
      expect(deserializeData).toHaveBeenCalledWith(0, deserializationContext);

      deserializeData.mockReturnValueOnce('some other data');
      expect(deserializeSkillData({ test: 22 }, deserializationContext)).toEqual('some other data');
      expect(deserializeData).toHaveBeenCalledWith({ test: 22 }, deserializationContext);
    });
  });
});
