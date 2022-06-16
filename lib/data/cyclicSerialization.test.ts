import {
  createCyclicDeserializationContext,
  createCyclicSerializationContext,
  CyclicDeserializationContext,
  cyclicDeserialize,
  cyclicSerialize,
  CyclicSerializedObject,
  finalizeCyclicSerialization,
} from './cyclicSerialization';
import { getObjectFromReferenceId, getReferenceId, ReferenceID, ReferencingArray } from './referencing';

describe('cyclicSerialization', () => {
  const cyclicDeserializedObjects = Array.from({ length: 5 })
    .map(() => ({
      data: Array.from({ length: 3 }),
    }))
    .map(
      (value, pIndex, array) =>
        Object.assign(value, {
          data: value.data.map((_, sIndex) => ({ refA: array[(pIndex + sIndex) % 5], refB: array[(pIndex + sIndex + 2) % 5] })),
        }) as { data: { refA: unknown; refB: unknown }[] },
    );

  const cyclicSerializedObject = {
    referencingArray: [
      {
        data: [
          { refA: 0, refB: 1 },
          { refA: 2, refB: 3 },
          { refA: 1, refB: 4 },
        ],
      },
      {
        data: [
          { refA: 1, refB: 4 },
          { refA: 3, refB: 0 },
          { refA: 4, refB: 2 },
        ],
      },
      {
        data: [
          { refA: 2, refB: 3 },
          { refA: 1, refB: 4 },
          { refA: 3, refB: 0 },
        ],
      },
      {
        data: [
          { refA: 3, refB: 0 },
          { refA: 4, refB: 2 },
          { refA: 0, refB: 1 },
        ],
      },
      {
        data: [
          { refA: 4, refB: 2 },
          { refA: 0, refB: 1 },
          { refA: 2, refB: 3 },
        ],
      },
    ],
    serializedObject: [0, 2, 1, 3, 4],
  };

  describe('cyclicSerialize', () => {
    it('stores the objects in context as expected', () => {
      const context = createCyclicSerializationContext();
      const cyclicObject = { objectsWithInternalReference: [] as { cyclicObject: unknown; value: number }[] };
      cyclicObject.objectsWithInternalReference.push({ cyclicObject, value: 1 });
      cyclicObject.objectsWithInternalReference.push({ cyclicObject, value: 2 });

      const expectedSerializedCyclicObject = {
        objectsWithInternalReference: [
          { cyclicObject: 0, value: 1 },
          { cyclicObject: 0, value: 2 },
        ],
        cyclicReferenceId: 0,
      };

      const serializer = (object: typeof cyclicObject, referencingArray: ReferencingArray) => ({
        objectsWithInternalReference: object.objectsWithInternalReference.map((obj) => ({
          cyclicObject: getReferenceId(obj.cyclicObject, referencingArray),
          value: obj.value,
        })),
      });

      expect(cyclicSerialize(cyclicObject, serializer, context)).toEqual(expectedSerializedCyclicObject);
      expect(context).toEqual({
        objectsWithCyclicDependencies: [expectedSerializedCyclicObject],
        referencingArray: [cyclicObject],
      });
    });
  });

  describe('finalizeCyclicSerialization', () => {
    it('puts the serialized object in referencingArray and provides back the final object to save in a file', () => {
      const context = createCyclicSerializationContext();
      const serializer = (object: typeof cyclicDeserializedObjects[number], referencingArray: ReferencingArray) => ({
        data: object.data.map((obj) => ({
          refA: getReferenceId(obj.refA, referencingArray),
          refB: getReferenceId(obj.refB, referencingArray),
        })),
      });
      const serializedArray = cyclicDeserializedObjects.map((obj) => cyclicSerialize(obj, serializer, context).cyclicReferenceId);

      const result = finalizeCyclicSerialization(serializedArray, context);

      expect(context).toEqual({ objectsWithCyclicDependencies: [], referencingArray: [] });
      expect(result).toEqual(cyclicSerializedObject);
    });

    it('throws an error if the serialized object is referenced in the referencingArray', () => {
      const context = createCyclicSerializationContext();
      const serializer = (object: typeof cyclicDeserializedObjects[number], referencingArray: ReferencingArray) => ({
        data: object.data.map((obj) => ({
          refA: getReferenceId(obj.refA, referencingArray),
          refB: getReferenceId(obj.refB, referencingArray),
        })),
      });
      const serializedArray = cyclicDeserializedObjects.map((obj) => cyclicSerialize(obj, serializer, context));
      const errorMessage = 'serializedObject must not be in referencingArray or contain object in referencingArray, this would break deserialization';

      expect(() => finalizeCyclicSerialization(serializedArray[0], context)).toThrow(errorMessage);
      expect(() => finalizeCyclicSerialization(serializedArray, context)).toThrow(errorMessage);
      expect(() => finalizeCyclicSerialization({ a: serializedArray[0] }, context)).toThrow(errorMessage);
      expect(context).not.toEqual({ objectsWithCyclicDependencies: [], referencingArray: [] });
    });

    it('throws an error if the serialized object cannot lead to deserialization', () => {
      const context = createCyclicSerializationContext();
      const errorMessage = 'serializedObject must not be a boolean, null or undefined';
      expect(() => finalizeCyclicSerialization(null, context)).toThrow(errorMessage);
      expect(() => finalizeCyclicSerialization(undefined, context)).toThrow(errorMessage);
      expect(() => finalizeCyclicSerialization(true, context)).toThrow(errorMessage);
      expect(() => finalizeCyclicSerialization(false, context)).toThrow(errorMessage);
    });
  });

  describe('createCyclicDeserializationContext', () => {
    it('creates a cyclic deserialization context properly', () => {
      const serializedObject: CyclicSerializedObject<undefined> = {
        referencingArray: [{ a: 0 }, { b: 1 }],
        serializedObject: undefined,
      };
      const context = createCyclicDeserializationContext(serializedObject);
      expect(context.serializedReferencingArray === serializedObject.referencingArray).toBeTruthy();
      expect(context.serializedReferencingArray).toEqual([{ a: 0 }, { b: 1 }]);
      expect(context.deserializedReferencingArray).toHaveLength(2);
      expect(context.deserializedReferencingArray[0] === context.deserializedReferencingArray[1]).toEqual(false);
    });
  });

  describe('cyclicDeserialize', () => {
    it('deserialize simple cyclic object', () => {
      const context = createCyclicDeserializationContext({
        referencingArray: [{ a: 0 }],
        serializedObject: [0],
      });

      const deserializeReferencedObject = (object: { a: ReferenceID }, { deserializedReferencingArray }: CyclicDeserializationContext) => ({
        a: getObjectFromReferenceId(object.a, deserializedReferencingArray),
      });

      const deserializeArray = (object: number[], deserializationContext: CyclicDeserializationContext) =>
        object.map((value) =>
          cyclicDeserialize(
            getObjectFromReferenceId(value as ReferenceID, deserializationContext.serializedReferencingArray) as { a: ReferenceID },
            deserializeReferencedObject,
            deserializationContext,
          ),
        );

      const result = cyclicDeserialize([0], deserializeArray, context);
      expect(result[0] === result[0].a).toBeTruthy();
    });

    it('deserialize a complex object with no issue', () => {
      const context = createCyclicDeserializationContext(cyclicSerializedObject);

      const deserializeReferencedObject = (
        object: typeof cyclicSerializedObject['referencingArray'][number],
        { deserializedReferencingArray }: CyclicDeserializationContext,
      ) => ({
        data: object.data.map(({ refA, refB }) => ({
          refA: getObjectFromReferenceId(refA as ReferenceID, deserializedReferencingArray),
          refB: getObjectFromReferenceId(refB as ReferenceID, deserializedReferencingArray),
        })),
      });

      const deserializeArray = (object: number[], deserializationContext: CyclicDeserializationContext) =>
        object.map((value) =>
          cyclicDeserialize(
            getObjectFromReferenceId(
              value as ReferenceID,
              deserializationContext.serializedReferencingArray,
            ) as typeof cyclicSerializedObject['referencingArray'][number],
            deserializeReferencedObject,
            deserializationContext,
          ),
        );

      const result = cyclicDeserialize(cyclicSerializedObject.serializedObject, deserializeArray, context);
      expect(result).toEqual(cyclicDeserializedObjects);
      expect(result === cyclicDeserializedObjects).toBeFalsy();
      expect(result[0].data[0].refB === result[0].data[2].refA).toBeTruthy();
      expect(result[0] === result[0].data[0].refA).toBeTruthy();
      expect(result[2] === result[0].data[0].refB).toBeTruthy(); // <= input array was [0, 2, 1, ...] so refB points to result[2]
    });
  });
});
