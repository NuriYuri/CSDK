export type StateMutationFunction<T> = (state: T) => Partial<T>;

/**
 * State type for scene that needs to have state mutation queue due to use of noisy effects
 */
export type StateMutationQueue<T> = {
  mQueue: StateMutationFunction<T>[];
} & T;

/**
 * Test if the scene state has any state mutation pending
 */
export const hasStateMutationQueued = <T>(state: StateMutationQueue<T>) => state.mQueue.length !== 0;

/**
 * Add a state mutation to the state mutation queue (will be executed after previous state mutations)
 */
export const queueStateMutation = <T>(state: StateMutationQueue<T>, mutation: StateMutationFunction<T>) => {
  state.mQueue = [mutation, ...state.mQueue];
};

/**
 * Add several state mutation to the state mutation queue (will be executed in order after previous state mutations)
 */
export const queueStateMutations = <T>(state: StateMutationQueue<T>, mutations: StateMutationFunction<T>[]) => {
  state.mQueue = [...mutations.reverse(), ...state.mQueue];
};

/**
 * Execute the current state mutation (if any) and return updated state
 */
export const executeStateMutation = <T>(state: StateMutationQueue<T>) => {
  if (hasStateMutationQueued(state)) {
    const mutation = state.mQueue.pop();
    if (mutation) return { ...state, ...mutation(state) };
  }
  return state;
};
