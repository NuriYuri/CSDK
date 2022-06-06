import { Scene } from '../src/scene';
import { onCanItemBeUsed, onUseItem, useItem, canItemBeUsed, GenericItemActableSceneState, ItemBase } from '../src/item';

// This example currently sucks, sorry. It might be improved in the future

const testScene: Scene<GenericItemActableSceneState & { test: boolean }> = {
  drawFrame: () => {
    return;
  },
  isRunning: () => true,
  processStates: (_, states) => states,
  states: {
    test: true,
  },
};

export type BallItem = ItemBase<{ catchRate: number }, 'ball'>;
export type HealItem = ItemBase<{ hp: number }, 'heal'>;
export type Item = BallItem | HealItem;

const items: Item[] = [
  { type: 'ball', id: 'ball', category: 'category', order: 0, price: 200, data: { catchRate: 5 } },
  { type: 'heal', id: 'heal', category: 'category', order: 0, price: 100, data: { hp: 0 } },
];

console.log('Nothing defined');
console.log(canItemBeUsed(items[0], testScene.states));
console.log(canItemBeUsed(items[1], testScene.states));
console.log(useItem(items[0], testScene.states));
console.log(useItem(items[1], testScene.states));

onCanItemBeUsed('ball', (item: BallItem, scene) => {
  console.log(item.data);
  return true;
});
onCanItemBeUsed('heal', (item: HealItem, scene) => {
  console.log(item.data);
  return true;
});
onUseItem('ball', (item: BallItem, states) => ({ itemAction: { item, handle: () => {} } }));
onUseItem('heal', (item: HealItem, states) => ({ itemAction: { item, handle: () => {} } }));

console.log('All defined');
console.log(canItemBeUsed(items[0], testScene.states));
console.log(canItemBeUsed(items[1], testScene.states));
console.log(useItem(items[0], testScene.states));
console.log(useItem(items[1], testScene.states));
