import { createDataCollection, getDataFromDataCollection, loadDataCollection, UNDEF_DATA_ID } from './dataCollections';

describe('dataCollections', () => {
  describe('createDataCollection', () => {
    it('creates a new data collection properly', () => {
      const dataCollection = createDataCollection((collectionName) => [{ id: collectionName, collectionName }], {
        test: [{ id: '', collectionName: '' }],
        test2: [{ id: '' }],
      });

      expect(dataCollection.collections).toEqual({ test: [{ id: '', collectionName: '' }], test2: [{ id: '' }] });
      expect(dataCollection.dataLoadFunction('test2')).toEqual([{ id: 'test2', collectionName: 'test2' }]);
      expect(dataCollection.dataLoadFunction('test')).toEqual([{ id: 'test', collectionName: 'test' }]);
    });
  });

  describe('loadDataCollection', () => {
    it('calls the dataLoadFunction and replace data in the corresponding collection', () => {
      const dataLoadFunction = jest.fn();
      dataLoadFunction.mockReturnValueOnce([{ id: 'test' }]);
      dataLoadFunction.mockReturnValueOnce([{ id: 'test1', collectionName: 'thing' }]);
      const dataCollection = createDataCollection(dataLoadFunction, {
        test: [{ id: '', collectionName: '' }],
        test2: [{ id: '' }],
      });

      loadDataCollection(dataCollection, 'test2');
      loadDataCollection(dataCollection, 'test');
      expect(dataCollection.collections).toEqual({ test: [{ id: 'test1', collectionName: 'thing' }], test2: [{ id: 'test' }] });
      expect(dataLoadFunction).toHaveBeenNthCalledWith(1, 'test2');
      expect(dataLoadFunction).toHaveBeenNthCalledWith(2, 'test');
    });
  });

  describe('getDataFromDataCollection', () => {
    it('provides the right data from the collection based on requested collection & id', () => {
      const dataCollection = createDataCollection(() => [], {
        test: [{ id: 'test', collectionName: 'wol' }],
        test2: [{ id: 'test' }],
      });

      expect(getDataFromDataCollection(dataCollection, 'test', 'test')).toEqual({ id: 'test', collectionName: 'wol' });
      expect(getDataFromDataCollection(dataCollection, 'test2', 'test')).toEqual({ id: 'test' });
    });

    it('returns the __undef__ object from collection if id does not exist', () => {
      const dataCollection = createDataCollection(() => [], {
        test: [
          { id: 'test', collectionName: 'wol' },
          { id: UNDEF_DATA_ID, collectionName: '55' },
        ],
        test2: [{ id: 'test' }, { id: UNDEF_DATA_ID }],
      });

      expect(getDataFromDataCollection(dataCollection, 'test', 'test33')).toEqual({ id: UNDEF_DATA_ID, collectionName: '55' });
      expect(getDataFromDataCollection(dataCollection, 'test2', 'test33')).toEqual({ id: UNDEF_DATA_ID });
    });

    it('returns the first element from collection if id and __undef__ do not exist', () => {
      const dataCollection = createDataCollection(() => [], {
        test: [
          { id: 'test', collectionName: 'wol' },
          { id: 'test22', collectionName: 'wol' },
        ],
        test2: [{ id: 'test' }, { id: 'test22' }],
      });

      expect(getDataFromDataCollection(dataCollection, 'test', 'test33')).toEqual({ id: 'test', collectionName: 'wol' });
      expect(getDataFromDataCollection(dataCollection, 'test2', 'test33')).toEqual({ id: 'test' });
    });
  });
});
