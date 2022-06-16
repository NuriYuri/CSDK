import { Opaque } from './opaque';

export type ReferencingArray = unknown[];
export type ReferenceID = Opaque<number, 'referenceId'>;

export const findReferenceId = (object: unknown, referencingArray: ReferencingArray): ReferenceID | undefined => {
  const objectIndex = referencingArray.indexOf(object);
  if (objectIndex >= 0) return objectIndex as ReferenceID;

  return undefined;
};

export const getReferenceId = (object: unknown, referencingArray: ReferencingArray): ReferenceID => {
  const objectIndex = referencingArray.indexOf(object);
  if (objectIndex >= 0) return objectIndex as ReferenceID;

  referencingArray.push(object);
  return (referencingArray.length - 1) as ReferenceID;
};

export const getObjectFromReferenceId = (referenceId: ReferenceID, referencingArray: ReferencingArray): unknown => {
  if (referenceId >= referencingArray.length || referenceId < 0) throw new Error('Unknown reference');

  return referencingArray[referenceId];
};

export const overwriteObjectFromReferenceId = (object: unknown, referenceId: ReferenceID, referencingArray: ReferencingArray): void => {
  if (referenceId >= referencingArray.length || referenceId < 0) throw new Error('Unknown reference');

  referencingArray[referenceId] = object;
};
