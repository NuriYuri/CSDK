/**
 * Item definition and handlers
 *
 * # How to use
 *
 * ## Definition script
 * You need to define the actions items do in a definition script.
 * Item mainly provide a sub state a of the current scene state (if scene supports items).
 *
 * Here's an example of definition script:
 * ```ts
 * import { onCanItemBeUsed, onUseItem, ItemBase } from './item';
 *
 * type BallItem = ItemBase<{ catchRate: number }, 'ball'>;
 * type HealItem = ItemBase<{ hp: number }, 'heal'>;
 * export type Item = BallItem | HealItem;
 *
 * onCanItemBeUsed('ball', (item: BallItem, sceneState) => {
 *   if (somethingWith(sceneState)) return true;
 *
 *   return false;
 * });
 * onCanItemBeUsed('heal', (item: HealItem, sceneState) => true); // Can always be used
 * onUseItem('ball', (item: BallItem, sceneState) => ({ itemAction: { item, handle: () => somethingWith(sceneState, item) } }));
 * onUseItem('heal', (item: HealItem, sceneState) => ({ itemAction: { item, handle: () => somethingWith(sceneState, item) } }));
 * ```
 *
 * ## User script
 * In your scenes you might be subject to use items. This script exports two important function:
 * - `canItemBeUsed(item, sceneState)` : This function tells you if the item can be used in the context of the current scene state
 * - `useItem(item, sceneState)` : This function returns a mutated state of the scene you can spread into the scene state in order to process item
 *
 * In order to work with items, it's important that scene extends `GenericItemActableSceneState` (which is exported by this script).
 * This type holds a `itemAction` field telling if the scene should process an item that was used.
 * The `itemAction` field holds the used item and a `handle` function you can call in order to do the action related to the item.
 */

/**
 * Base structure describing an item
 *
 * @example type MyCustomItem = ItemBase<{ field1: string; field2: number }, 'customItem'>
 */
export type ItemBase<T, U extends string> = {
  readonly id: string;
  readonly type: U;
  readonly category: string;
  readonly order: number;
  readonly price: number;
  readonly data: T;
};

type ItemActableSceneState<T, U extends string> = {
  itemAction?: {
    item: ItemBase<T, U>;
    handle: () => void;
  };
};

/**
 * Generic definition of the state definition a scene should have to use items
 *
 * @example type SceneUsingItem = Scene<GenericItemActableSceneState & { field: boolean }>
 */
export type GenericItemActableSceneState = ItemActableSceneState<unknown, string>;

/** Type describing what input are expected to define a canItemBeUsed handler */
type GenericCanUseItemTesterHandler = <T, U extends string>(item: ItemBase<T, U>, sceneState: GenericItemActableSceneState) => boolean;
/** Type describing what input and output are expected to define a useItem handler */
type GenericUseItemHandler = <T, U extends string>(
  item: ItemBase<T, U>,
  sceneState: GenericItemActableSceneState,
) => Required<ItemActableSceneState<T, U>>;

const VOID_ITEM_ACTABLE_STATE: ItemActableSceneState<unknown, string> = {
  itemAction: undefined,
};
const CAN_BE_USED_HANDLERS: Record<string, GenericCanUseItemTesterHandler> = {};
const USE_HANDLERS: Record<string, GenericUseItemHandler> = {};

/**
 * Function registering the handler telling if an item can be used
 *
 * @example onCanItemBeUsed('heal', (item: HealItem, scene) => testSomethingAbout(item, scene));
 */
export const onCanItemBeUsed = <I extends ItemBase<T, U>, T, U extends string>(
  type: I['type'],
  handler: (item: I, sceneState: GenericItemActableSceneState) => boolean,
) => {
  CAN_BE_USED_HANDLERS[type] = handler as typeof CAN_BE_USED_HANDLERS[string];
};

/**
 * Function calling the handler to tell if the item can be used
 *
 * @example if (canItemBeUsed(item, states)) { doSomething }
 */
export const canItemBeUsed = (item: ItemBase<unknown, string>, sceneState: GenericItemActableSceneState) =>
  CAN_BE_USED_HANDLERS[item.type] ? CAN_BE_USED_HANDLERS[item.type](item, sceneState) : false;

/** Function registering the handler to call when useItem is called with an item */
export const onUseItem = <I extends ItemBase<T, U>, T, U extends string>(
  type: I['type'],
  handler: (item: I, sceneState: GenericItemActableSceneState) => Required<ItemActableSceneState<T, U>>,
) => {
  USE_HANDLERS[type] = handler as typeof USE_HANDLERS[string];
};

/**
 * Function calling the handler giving the state update
 *
 * @example return { ...states, ...useItem(item, states)}
 */
export const useItem = (item: ItemBase<unknown, string>, sceneState: GenericItemActableSceneState) =>
  USE_HANDLERS[item.type] ? USE_HANDLERS[item.type](item, sceneState) : VOID_ITEM_ACTABLE_STATE;
