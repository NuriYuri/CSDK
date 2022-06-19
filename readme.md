# CSDK

> What is CSDK?

CSDK is a library allowing to make RPG game with a high level of abstraction. CSDK originate from learnings of PSDK regarding some stuff like battle effects, god classes etc...

You can't make a game by simply including CSDK to your dependencies. You'll have to describe your game and couple it with another library like [raylib](https://www.raylib.com) or [sfml.js](https://github.com/XadillaX/sfml.js#readme). CSDK only provide few types and functions to handle the game.

- [CSDK](#csdk)
  - [CSDK's philosophy](#csdks-philosophy)
  - [CSDK's recommendations](#csdks-recommendations)
  - [CSDK's types](#csdks-types)
    - [Creature](#creature)
      - [Creature identifier](#creature-identifier)
      - [Generic creature data](#generic-creature-data)
      - [Define stats](#define-stats)
      - [Define specialized creature data](#define-specialized-creature-data)
    - [Effect](#effect)
      - [Effect context](#effect-context)
      - [Effect function](#effect-function)
      - [Creating an effect](#creating-an-effect)
      - [Registering an effect](#registering-an-effect)
      - [Serializing effect](#serializing-effect)
      - [Deserializing effect](#deserializing-effect)
    - [Element](#element)
    - [Item](#item)
    - [Skill](#skill)
    - [State](#state)
  - [CSDK's Scene](#csdks-scene)
    - [StateMutationQueue](#statemutationqueue)
  - [Save Data handling](#save-data-handling)
    - [Cyclic Serialization](#cyclic-serialization)
      - [Referencing](#referencing)
      - [Serialization](#serialization)
      - [Deserialization](#deserialization)
  - [Game Data Handling](#game-data-handling)
    - [Load the data of a collection](#load-the-data-of-a-collection)
    - [Get an object from the dataCollection](#get-an-object-from-the-datacollection)
    - [Example usage of `DataCollection`](#example-usage-of-datacollection)

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

## CSDK's types

CSDK provide several generic data type with their own helper functions, this allows dynamic feature implementation without being restricted to inflexible types like PSDK, Essentials or RPG Maker does.

### Creature

The `Creature` type contains the minimal information to simulate an actual game creature, if you want to extend it, you can define the type of the data fields.

#### Creature identifier

Unlike other objects (skill, item), the `Creature` type use two keys as identifier: `id` and `form`. Both are string because it makes more sens to read `blob` `red` than 5 1.

To make it easier with data fetching from DataCollection, you should define a type `DataCreature` and `DataCreatureForm` where `DataCreature` define id of the creature and `DataCreatureForm` define the form and all the form related attribute of the creature. Of course, you're not forced to use the forms.


#### Generic creature data

In the generic creature data we defined the following members:

- `hp`: which corresponds to creature Health Points.
- `states`: which list all the states the creature has
- `skills`: which list all the skills the creature currently know
- `level`: which specify the current level of the creature
- `exp`: which specify the total amount of experience the creature has
- `effects`: which records all the effects applied to the creature (by category)

You might be astonished by the lack of stats, items or passives (abilities). The reason are pretty simple. Each RPG define their own stats and CSDK cannot assume that. Same goes for passive or item, the way it's handled vary between games.

#### Define stats

In order to define the stats, you have two functions:

- `registerComputeStatFunction((creature, stat) => number)`: which register the function responsive of computing the stats.
- `computeStat(creature, stat)`: which computes the stat based on the previously provided function.

By default `computeStat` returns 1. We highly recommend that none of the stats goes below 1.


Example:
```ts
export { computeStat } from 'csdk';
import { registerComputeStatFunction } from 'csdk';
type StatName = 'maxHp' | 'sp' | 'spd';
type GameCreature = Creature<{ sp: number }>;

declare function computeStat(creature: GameCreature, stat: StatName): number;
registerComputeStatFunction((creature: GameCreature, stat: StatName) => {
  switch(stat) {
    case 'maxHp':
    case 'spd':
      return Math.min(1, creature.level * 10);
    case 'sp':
      return creature.data.sp;
    default:
      return 1;
  }
});
```

> **Note**  
> You're not forced to use helper function exported by CSDK for stats, you can make your own soup.

#### Define specialized creature data

As shown in the stats example, you can define specialized data for the creature. But defining the data is not sufficient, especially if that data might contain cyclic dependencies.

For that matter, CSDK exports 4 functions:

- `registerSerializeCreatureData((creature, referencingArray) => unknown)`: which defines how to serialize the `creature.data` field (should return the serialized data field only)
- `serializeCreature(creature, referencingArray)`: which serialize the whole creature and calls the registered serializer for the data field.
- `registerDeserializeCreatureData((data, context) => unknown)`: which defines how to deserialize the data field of the creature.
- `deserializeCreature(creature, context)`: which deserialize a creature and its data using the previously defined deserializer.

Example:
```typescript
type GameCreature = Creature<{ friend: GameCreature }>; // introduction of cyclic dependency

registerSerializeCreatureData((creature: GameCreature, referencingArray) => ({
  friend: getReferenceId(creature.data.friend, referencingArray),
}));

registerDeserializeCreatureData((data: { friend: ReferenceID }, context): GameCreature['data'] => ({
  friend: getObjectFromReferenceId(data.friend, context.deserializedReferencingArray),
}));
```

### Effect

Effects in CSDK are tiny data objects bound to a list of functions allowing to define what the effect does.

Effects are meant to be stored in creatures but they can also be stored in other places (battle bank, terrain etc...).

In the creatures, the effect are stored in a Record which use a category as key (string) and has Array of Effects as values.

#### Effect context

In order to use the effect functions, you need a context which provides who is affected by the effect and what's the payload of the function.

The effect context contains the following attributes:
- `target`: Creature that is targeted by the current action involving the effect.
- `user`: Optional creature that might have triggered the action
- `skill`: Optional skill that might have triggered the action
- `cancellationReason`: Optional mutation function to call if the effect has cancelled the action
- `data`: Payload of the effect function to process stuff. Example, number of HP to deal to the target. This value can't be mutated but its member can.

#### Effect function

Effect function are meant to be called while processing the effect for some actions.

There's 4 kind of effect function:
1. Computing function: Those function will have no return but are expected to mutate the members of the `data` field in the effect context.
2. Preventing functions: Those function returns either `undefined`, `'passthrough'` or `'prevent'`. They are expected to effect iteration if return is defined and to change the `cancellationReason`. Those are meant to be used to test things like being able to set a state to a creature or to even deal damages.
3. Noisy functions: Those functions are expected to return a StateMutation function that will make the scene perform stuff like displaying a message.
4. Cleanup function: The function `onCleanup` returns a boolean telling if the effect should be removed from the effect stack.

#### Creating an effect

To create an effect you should call the function `createEffect(category, effect)`. This function takes an effect without the `effectFunctions` and add the `effectFunctions` to it depending on its `type` and `category`.

#### Registering an effect

The act of registering an effect just mean specifying the `effectFunctions` effect will get when calling `createEffect`. To do this, call `registerEffect(category, type, effectFunctions)`.

The provided `effectFunctions` can be partial, for example, you can just provide the onCleanup function. All other function will be voided (won't cause any crash if being called).

Example:
```typescript
registerEffect('state', 'immunity', { onDamageComputation: (effect: ImmunityEffect, context: HpDownContext) => { context.hp = 0 } });
```

#### Serializing effect

Since all effect can contain various data, you have to define a serializer for those effect if the said effect might end up in save file.

To do so call the function `registerSerializeEffect(category, type, serializer: (effect, referencingArray) => Effect)`.

When all serializable effect have their own serialization function, `serializeEffect(category, effect, referencingArray)` can be called.

> **Note**  
> This function is being called by the `serializeCreature` function.

#### Deserializing effect

In order to be able to restore a saved effect, you need to define a deserializer. This can be done with `registerDeserializeEffect(category, type, deserializer: (effect, context) => Effect)`.

Similarly to serialization, effect can be deserialized using `deserializeEffect(category, effect, context)`.

> **Note**  
> This function is being called by the `serializeCreature` function.
### Element

TODO: Write it

### Item

TODO: Write it

### Skill

TODO: Write it

### State

TODO: Write it

## CSDK's Scene

TODO: Write it

### StateMutationQueue

TODO: Write it

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

#### Deserialization

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
