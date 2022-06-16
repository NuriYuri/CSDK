import { executeStateMutation, hasStateMutationQueued, queueStateMutation, queueStateMutations, StateMutationFunction } from './stateMutationQueue';

describe('stateMutationQueue', () => {
  describe('hasStateMutationQueued', () => {
    it('returns false if the queue is empty', () => {
      expect(hasStateMutationQueued({ mQueue: [] })).toEqual(false);
    });

    it('returns true if the queue contains mutations', () => {
      expect(hasStateMutationQueued({ mQueue: [() => ({})] })).toEqual(true);
    });
  });

  describe('queueStateMutation', () => {
    it('queues a single state mutation to the scene state by mutating the state', () => {
      const state = { mQueue: [] as StateMutationFunction<unknown>[] };
      const mutation = jest.fn();
      queueStateMutation(state, mutation);
      expect(state.mQueue).toEqual([mutation]);
    });
  });

  describe('queueStateMutations', () => {
    it('queues several state mutation in a way it will be executed in order', () => {
      const state = { mQueue: [] as StateMutationFunction<unknown>[] };
      const mutation1 = jest.fn();
      const mutation2 = jest.fn();
      const mutation3 = jest.fn();
      queueStateMutations(state, [mutation1, mutation2, mutation3]);
      expect(state.mQueue).toEqual([mutation3, mutation2, mutation1]);
    });
  });

  describe('executeStateMutation', () => {
    it('properly execute the mutations in order they were given', () => {
      const state = { mQueue: [] as StateMutationFunction<unknown>[], val: 5 };
      const mutation1 = jest.fn();
      const mutation2 = jest.fn();
      const mutation3 = jest.fn();
      queueStateMutations(state, [mutation1, mutation2, mutation3]);

      mutation1.mockReturnValueOnce({ val: 1 });
      mutation2.mockReturnValueOnce({ val: 2 });
      mutation3.mockReturnValueOnce({ val: 3 });
      const state2 = executeStateMutation<{ val: number }>(state);
      expect(mutation1).toHaveBeenCalledWith({ mQueue: [mutation3, mutation2], val: 5 });

      const state3 = executeStateMutation<{ val: number }>(state2);
      expect(mutation2).toHaveBeenCalledWith({ mQueue: [mutation3], val: 1 });

      const state4 = executeStateMutation<{ val: number }>(state3);
      expect(mutation3).toHaveBeenCalledWith({ mQueue: [], val: 2 });

      expect(state4).toEqual({ mQueue: [], val: 3 });
    });
  });
});
