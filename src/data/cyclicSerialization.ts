import {
  findReferenceId,
  getObjectFromReferenceId,
  getReferenceId,
  overwriteObjectFromReferenceId,
  ReferenceID,
  ReferencingArray,
} from './referencing';

/**
 * Cyclic serialization:
 * This process aim to help serializing a bunch of object that could reference each other in a cyclic manner.
 * The best example is the creatures, they may hold effects that reference back to the creature object.
 * Saving cyclic stuff in JSON is impossible, this module offer ways to do it an preserve the "references" during deserialization.
 *
 * Process:
 * 1. Create the context
 * 2. Serialize a cyclic object
 *  2.1. Save the cyclic object in referencingArray
 *  2.2. Serialize the object to objectsWithCyclicDependencies with cyclicReferenceId from reference
 * 3. Finalize serialization by replacing all original cyclic objects in referencingArray, to their objectsWithCyclicDependencies serializations
 */

type ObjectWithReferenceId = { cyclicReferenceId: ReferenceID };

export type CyclicSerializationContext = {
  objectsWithCyclicDependencies: ObjectWithReferenceId[];
  referencingArray: ReferencingArray;
};

export type CyclicSerializedObject<T> = {
  serializedObject: T;
  referencingArray: ReferencingArray;
};

export type CyclicDeserializationContext = {
  serializedReferencingArray: ReferencingArray;
  deserializedReferencingArray: ReferencingArray;
};

/** Creates a new `CyclicSerializationContext` to be used with `cyclicSerialize` and `finalizeCyclicSerialization` */
export const createCyclicSerializationContext = (): CyclicSerializationContext => ({ objectsWithCyclicDependencies: [], referencingArray: [] });

/** Perform the cyclic serialization of an object */
export const cyclicSerialize = <T, U>(
  object: T,
  serializer: (objectToSerialize: T, referencingArray: ReferencingArray) => Omit<U, 'cyclicReferenceId'>,
  context: CyclicSerializationContext,
): Omit<U, 'cyclicReferenceId'> & ObjectWithReferenceId => {
  const cyclicReferenceId = getReferenceId(object, context.referencingArray);
  const serializedObject = { ...serializer(object, context.referencingArray), cyclicReferenceId };
  context.objectsWithCyclicDependencies.push(serializedObject);
  return serializedObject;
};

/** Throw an error if serialized object is null, undefined or a boolean */
const assertSerializedObjectDeserializable = <T>(serializedObject: T) => {
  if (serializedObject === null || serializedObject === undefined || typeof serializedObject === 'boolean') {
    throw new Error('serializedObject must not be a boolean, null or undefined');
  }
};

/** Throw an error of the serialized object might break deserialization (weak test) */
const assertSerializedObjectNotInOrReferencingInReferencingArray = <T>(serializedObject: T, referencingArray: ReferencingArray) => {
  if (
    findReferenceId(serializedObject, referencingArray) !== undefined ||
    (Array.isArray(serializedObject) && serializedObject.some((value) => findReferenceId(value, referencingArray) !== undefined)) ||
    (typeof serializedObject === 'object' && Object.values(serializedObject).some((value) => findReferenceId(value, referencingArray) !== undefined))
  ) {
    throw new Error('serializedObject must not be in referencingArray or contain object in referencingArray, this would break deserialization');
  }
};

/** Finalize the cyclic serialization and reset the context */
export const finalizeCyclicSerialization = <T>(serializedObject: T, context: CyclicSerializationContext): CyclicSerializedObject<T> => {
  assertSerializedObjectDeserializable(serializedObject);

  const { referencingArray, objectsWithCyclicDependencies } = context;
  objectsWithCyclicDependencies.forEach((object) => {
    overwriteObjectFromReferenceId(object, object.cyclicReferenceId, referencingArray);
    // @ts-ignore ts(2790)
    delete object.cyclicReferenceId;
  });

  assertSerializedObjectNotInOrReferencingInReferencingArray(serializedObject, referencingArray);

  Object.assign(context, createCyclicSerializationContext());

  return {
    serializedObject,
    referencingArray,
  };
};

/** Creates a `CyclicDeserializationContext` to be used with `cyclicDeserialize` */
export const createCyclicDeserializationContext = <T>(object: CyclicSerializedObject<T>): CyclicDeserializationContext => ({
  serializedReferencingArray: object.referencingArray,
  deserializedReferencingArray: Array.from({ length: object.referencingArray.length }, () => ({})),
});

/** Perform the cyclic deserialization of an object */
export const cyclicDeserialize = <T, U>(
  object: T,
  deserializer: (objectToDeserialize: T, deserializationContext: CyclicDeserializationContext) => U,
  context: CyclicDeserializationContext,
): U => {
  const deserializedObject = deserializer(object, context);
  const referenceId = findReferenceId(object, context.serializedReferencingArray);
  if (referenceId !== undefined) {
    const referencedObject = getObjectFromReferenceId(referenceId, context.deserializedReferencingArray) as U;
    Object.assign(referencedObject, deserializedObject);
    return referencedObject;
  }

  return deserializedObject;
};
