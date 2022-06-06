import { canItemBeUsed, ItemBase, onCanItemBeUsed, onUseItem, useItem } from './item';

describe('item', () => {
  const item: ItemBase<{}, 'test'> = { type: 'test', category: 'testCat', id: 'item', order: 0, price: 0, data: {} };

  describe('onCanItemBeUsed -> canItemBeUsed', () => {
    it('has a default state that returns false when no item has been registered', () => {
      expect(canItemBeUsed(item, {})).toEqual(false);
    });

    it('Registers the handler and uses it properly', () => {
      const handler = jest.fn();
      handler.mockReturnValueOnce(true);
      handler.mockReturnValueOnce(false);
      onCanItemBeUsed('test', handler);
      expect(canItemBeUsed(item, { val: 1 } as unknown)).toEqual(true);
      expect(canItemBeUsed(item, { val: 2 } as unknown)).toEqual(false);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, item, { val: 1 });
      expect(handler).toHaveBeenNthCalledWith(2, item, { val: 2 });
    });
  });

  describe('onUseItem -> useItem', () => {
    it('has a default state that returns an state that says no item is being used', () => {
      expect(useItem(item, {})).toEqual({ itemAction: undefined });
    });

    it('Registers the handler and uses it properly', () => {
      const handler = jest.fn();
      const subHandler = jest.fn();
      handler.mockImplementationOnce((calledItem, sceneState) => ({ ...sceneState, itemAction: { item: calledItem, handler: subHandler } }));
      onUseItem('test', handler);
      expect(useItem(item, { val: 1 } as unknown)).toEqual({
        val: 1,
        itemAction: {
          item,
          handler: subHandler,
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(item, { val: 1 });
    });
  });
});
