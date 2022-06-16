import { findReferenceId, getObjectFromReferenceId, getReferenceId, overwriteObjectFromReferenceId, ReferenceID } from './referencing';

describe('referencing', () => {
  describe('findReferenceId', () => {
    it('finds the reference ID for an existing object in the referencingArray', () => {
      expect(findReferenceId('test', ['a', 'b', 'test', 'c'])).toEqual(2);
    });

    it('does not create a new reference id for an un-existing object in the referenceArray', () => {
      const referenceArray = [];
      expect(findReferenceId('test', referenceArray)).toEqual(undefined);
      expect(referenceArray).toEqual([]);
    });
  });

  describe('getReferenceId', () => {
    it('gets the reference ID for an existing object in the referencingArray', () => {
      expect(getReferenceId('test', ['a', 'b', 'test', 'c'])).toEqual(2);
    });

    it('creates a new reference id for an un-existing object in the referenceArray', () => {
      const referenceArray = [];
      expect(getReferenceId('test', referenceArray)).toEqual(0);
      expect(getReferenceId('test2', referenceArray)).toEqual(1);
      expect(referenceArray).toEqual(['test', 'test2']);
      expect(getReferenceId('test', referenceArray)).toEqual(0);
      expect(getReferenceId('test2', referenceArray)).toEqual(1);
    });
  });

  describe('getObjectFromReferenceId', () => {
    it('returns the expected object from the reference', () => {
      expect(getObjectFromReferenceId(0 as ReferenceID, ['test'])).toEqual('test');
      expect(getObjectFromReferenceId(2 as ReferenceID, ['test', 'test2', 'test3'])).toEqual('test3');
    });

    it('throw an error if the reference is invalid', () => {
      expect(() => getObjectFromReferenceId(-1 as ReferenceID, ['test'])).toThrow('Unknown reference');
      expect(() => getObjectFromReferenceId(2 as ReferenceID, ['test'])).toThrow('Unknown reference');
    });
  });

  describe('overwriteObjectFromReferenceId', () => {
    it('properly overwrite the referenced object', () => {
      const referenceArray = ['test', 'test2', 'test3'];
      overwriteObjectFromReferenceId('test55', 0 as ReferenceID, referenceArray);
      expect(referenceArray).toEqual(['test55', 'test2', 'test3']);
      overwriteObjectFromReferenceId('test62', 2 as ReferenceID, referenceArray);
      expect(referenceArray).toEqual(['test55', 'test2', 'test62']);
    });

    it('throw an error if the reference is invalid', () => {
      const referenceArray = ['test', 'test2'];
      expect(() => overwriteObjectFromReferenceId('test55', -1 as ReferenceID, referenceArray)).toThrow('Unknown reference');
      expect(() => overwriteObjectFromReferenceId('test62', 2 as ReferenceID, referenceArray)).toThrow('Unknown reference');
      expect(referenceArray).toEqual(['test', 'test2']);
    });
  });
});
