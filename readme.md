# CSDK

> What is CSDK?

CSDK is a library allowing to make RPG game with a high level of abstraction. CSDK originate from learnings of PSDK regarding some stuff like battle effects, god classes etc...

You can't make a game by simply including CSDK to your dependencies. You'll have to describe your game and couple it with another library like [raylib](https://www.raylib.com) or [sfml.js](https://github.com/XadillaX/sfml.js#readme). CSDK only provide few types and functions to handle the game.

## CSDK's philosophy

CSDK has little key philosophy points:

- Root types like creature shall be extended with user specialized data type
- Even though it's easier to make games with OOP, CSDK is hermetic to the OOP doctrine
- Anything that can be specialized by user can be registered by user and has default behaviors
- Scene must rely on state, thus have a state update function and a draw function
- CSDK shall be used with any graphic and/or audio rendering library, it does not force you into using something in particular

## CSDK's recommendations

- CSDK highly recommend that projects using CSDK derive and specialize types and functions provided by CSDK in a way that types might not be unknown on logic side of the project.
- CSDK Author might be wrong, you have to discuss its design choice as long as it does not break CSDK philosophy.

## Save Data handling

Everything revolve around Creatures in CSDK, Creature = Actor. What you might save in user save file is a collection of Creature, you usually do not need to save any other sort of data (like items, skills, etc...). Regardless, Creatures do have skill, states, etc... And some of its data, like effects might refer to the creature itself. This leads to cyclic dependency!

Don't panic, CSDK comes with a tiny solution helping to handle this kind of issue.

### Cyclic Serialization

Cyclic Serialization is a way to serialize object using references. When it's known that a member of an object refers to a parent of the same object, instead of serializing the member of the child object, we put a reference to the parent object. There's helper functions to handle that kind of matter.

#### Referencing

Referencing comes with 2 types and few functions:

- `ReferencingArray`: a collection of unknown objects that are linked to a `ReferenceID`
- `ReferenceID`: an opaque type giving you the reference to an object into the `ReferencingArray`
- `findReferenceId(object, referencingArray)`: a function giving you the `ReferenceID` of `object` if it exists into `referencingArray`. (Returns undefined otherwise).
- `getReferenceId(object, referencingArray)`: a function that does the same as `findReferenceId` but if `object` is not into `referencingArray`, it creates the `ReferenceID` and insert `object` into `referencingArray`.
- `getObjectFromReferenceId(referenceId, referencingArray)`: a function that provides the desired object from `referencingArray` using `referenceId`. Throws `Unknown reference` error if `referenceId` does not refer to an object into `referencingArray`.
- `overwriteObjectFromReferenceId(object, referenceId, referencingArray)`: a function that overwrites the object referenced by `referenceId` with `object` inside `referencingArray`. Throws `Unknown reference` error if `referenceId` does not refer to an object into `referencingArray`.

You might need to use those functions while serializing objects.

#### Serialization

The process of serialization with cyclic dependency relies on 3 functions, 2 types and a type composition.

1. To start the serialization process, you have to call `createCyclicSerializationContext()` which returns a `CyclicSerializationContext` used in the 2 other serialization function.
2. To serialize a parent object that might have cyclic dependency with its child call `cyclicSerialize(object, serializer, context)`. This function creates a `ReferenceID` for `object`, calls the `serializer` with `object` and `context.referencingArray` as parameter and returns an union of the `serializer` result and `{ cyclicReferenceId: ReferenceID }` (which is actually holding the `ReferenceID` to object).
3. Once all objects are serialized, you can create the `CyclicSerializedObject` using `finalizeCyclicSerialization(serializedObject, context)`. It returns what you want to save into the save file.

> **Warning**
> You must never refer to the output of `cyclicSerialize` into `serializedObject` because you will not be able to deserialize `serializedObject`. Instead, you should always store the `ReferenceID` into `serializedObject` so the deserialization process can guarantee that parents and child will refer to the exact references in Memory. (a === b).

> **Note**
> Cyclic serialization only applies to parent objects! You can just use basic serializer using `object` and `referencingArray` for child objects.

### Deserialization

The process of deserialization with cyclic dependency relies on 2 functions, 2 types and the promise that you call the `cyclicDeserialize` over all parent objects.

1. To start the deserialization, you has to call `createCyclicDeserializationContext(object)` which returns a `CyclicDeserializationContext`. Object is expected to be shaped like the result of `finalizeCyclicSerialization` from Serialization process.
2. To deserialize an object you can call `cyclicDeserialize(object, deserializer, context)`. This function calls the `deserializer` function with `object` and `context`. Then get the `ReferenceID` of object into `context.serializedReferencingArray` to mutate the object with identic `ReferenceID` from `context.deserializedReferencingArray` with the result of `deserialize`. It always return an object shaped like the result of `deserialize`

> **Note**
> While deserializing child, you must get parents object using `getObjectFromReferenceId` with `context.deserializedReferencingArray`. Even if the parent object can be deserialized after the child object. `cyclicDeserialize` is doing JS witchcraft to ensure references stays the same after deserialization.

## Game Data Handling

CSDK helps to handle Game Data using the `DataCollection` type and few functions. The `DataCollection` type holds a function to load a collection of data and a `CollectionRecord` which requires that each array linked to a key of that record contains objects that are shaped with an `id` member.

To be able to infer types properly the `DataCollection` must be created using `createDataCollection(dataLoadFunction, defaultCollectionsState)`.

The `dataLoadFunction` takes the collection name as parameter and returns the loaded Array of expected objects in that collection.

The `defaultCollectionsState` must contain the sate of the `collections` containing at least 1 object in each collection to ensure that you will always get something out of `DataCollection`.

### Load the data of a collection

To load the data, you can call the function `loadDataCollection(dataCollection, collectionName)`. It will call the `dataLoadFunction` provided to `createDataCollection` and replace the content linked to `collectionName` inside `dataCollection`.

### Get an object from the dataCollection

To get an object from the dataCollection, you can call `getDataFromDataCollection(dataCollection, collectionName, id)`. This should always return an object regardless of if id match or not.

This function attempts to get the following object

1. object of `collectionName` with matching `id`
2. object of `collectionName` with id matching `__undef__` if no matching `id`
3. first object of `collectionName` if no match at all

> **Warning**
> It is expected that each collections contain at least 1 object. If that's not the case, `getDataFromDataCollection` will return `undefined`. It's up to you to ensure that it never happens otherwise you'll have to handle that case.

> **Note**
> It's best make object with id `__undef__` the first so `getDataFromDataCollection` won't loop a second time.

### Example usage of `DataCollection`

```typescript
type GameDataCollectionRecords = {
  items: { readonly id: string; value: number }[];
  moves: { readonly id: string; power: number }[];
};
const defaultCollectionsState: GameDataCollectionRecords = {
  items: [{ id: '__undef__', value: 0 }],
  moves: [{ id: '__undef__', power: 5 }],
};

const dataCollection = createDataCollection((collectionName) => {
  // Do something with collectionName that returns the right data type
  return defaultCollectionsState[collectionName];
}, defaultCollectionsState);

loadDataCollection(dataCollection, 'items');
loadDataCollection(dataCollection, 'moves');

const item = getDataFromDataCollection(dataCollection, 'items', 'testItem');
```

> **Note**
> If you plan to provide the data with `defaultCollectionState` by default you can define the `dataLoadFunction` as follow: `(collectionName) => defaultCollectionState[collectionName]`.
