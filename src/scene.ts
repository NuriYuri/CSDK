let sceneProcessingCleanup: () => void | undefined;
let getDelta: () => number = () => 0.016666;

/**
 * Scene that is executed in during the game loop.
 * The game must have called `startSceneProcessing` in its entry point so the object gets processed.
 */
export type Scene<T> = {
  /** Function responsive of computing the new scene state based on elapsed time. */
  processStates: (delta: number, states: T) => T;
  /** Function responsive of drawing the scene to the screen. */
  drawFrame: (states: T) => void;
  /**
   * Function responsive of telling if the scene is still running.
   * This function is called before computing the next states and before drawing the frame
   * so the previous scene can compute its new state before being drawn to the screen
   */
  isRunning: (states: T) => boolean;
  /** Get the scene that should be processed if this scene is not running anymore */
  getNextScene?: (states: T) => Scene<unknown> | undefined;
  /** States of this scene */
  states: T;
};

const handleSceneDone = <T>(scene: Scene<T>) => {
  if (scene.getNextScene) {
    const nextScene = scene.getNextScene(scene.states);
    if (nextScene) return processScene(nextScene);
  }

  if (sceneProcessingCleanup) sceneProcessingCleanup();
  sceneProcessingCleanup = undefined;
};

const processScene = <T>(scene: Scene<T>) => {
  if (!scene.isRunning(scene.states)) return handleSceneDone(scene);

  const updatedScene = {
    ...scene,
    states: scene.processStates(getDelta(), scene.states),
  };
  updatedScene.drawFrame(updatedScene.states);

  setImmediate(processScene, updatedScene);
};

/**
 * Starts the global game loop with the given scene.
 * Please avoid processing multiple scene in parallel.
 * @param cleanup Function to call when no next scene will be executed
 * @param frameTime Function to call to get the elapsed time between frames
 */
export const startSceneProcessing = <T>(scene: Scene<T>, cleanup: () => void, frameTime: () => number) => {
  if (sceneProcessingCleanup) throw new Error('Cannot run several scene in parallel');

  sceneProcessingCleanup = cleanup;
  getDelta = frameTime;
  setImmediate(processScene, scene);
};
