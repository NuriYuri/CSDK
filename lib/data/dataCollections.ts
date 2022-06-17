type CollectionRecord = Record<string, { readonly id: string }[]>;

export const UNDEF_DATA_ID = '__undef__';

export type DataCollection<T extends CollectionRecord> = {
  readonly dataLoadFunction: (collectionName: keyof T) => T[typeof collectionName];
  readonly collections: T;
};

export const createDataCollection = <T extends CollectionRecord>(
  dataLoadFunction: (collectionName: keyof T) => T[typeof collectionName],
  defaultCollectionsState: T,
): DataCollection<T> => ({
  dataLoadFunction,
  collections: defaultCollectionsState,
});

export const loadDataCollection = <T extends CollectionRecord>(dataCollection: DataCollection<T>, collectionName: keyof T) => {
  dataCollection.collections[collectionName] = dataCollection.dataLoadFunction(collectionName);
};

export const getDataFromDataCollection = <T extends CollectionRecord>(
  dataCollection: DataCollection<T>,
  collectionName: keyof T,
  id: string,
): T[typeof collectionName][number] => {
  const collection = dataCollection.collections[collectionName];
  if (collection.length === 0) throw new Error('Empty collection, cannot load data');

  return collection.find((data) => data.id === id) || collection.find((data) => data.id === UNDEF_DATA_ID) || collection[0];
};
