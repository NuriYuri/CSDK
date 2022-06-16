import { Scene, startSceneProcessing } from './scene';

const mockScene = () => ({
  drawFrame: jest.fn(),
  getNextScene: jest.fn(),
  isRunning: jest.fn(),
  processStates: jest.fn(),
});

const forEventQueueTicks = async (n: number) => {
  return Array.from({ length: n }).reduce(async (prev) => {
    await prev;
    return new Promise((resolve) => setImmediate(resolve));
  }, Promise.resolve());
};

describe('scene', () => {
  describe('startSceneProcessing', () => {
    it('calls the handler of the scene properly and stops if the scene is done', async () => {
      const scene = mockScene();
      const cleanup = jest.fn();
      const getDelta = jest.fn();
      getDelta.mockReturnValue(1);
      scene.processStates.mockImplementation((delta, states) => ({ value: states.value + delta }));
      scene.isRunning.mockReturnValueOnce(true);
      scene.isRunning.mockReturnValueOnce(true);
      scene.isRunning.mockReturnValueOnce(false);

      const sceneParam: Scene<{ value: number }> = { ...scene, states: { value: 0 } };
      startSceneProcessing(sceneParam, cleanup, getDelta);

      await forEventQueueTicks(3);

      expect(sceneParam.states).toEqual({ value: 0 });
      expect(scene.isRunning).toHaveBeenCalledTimes(3);
      expect(scene.isRunning).toHaveBeenNthCalledWith(1, { value: 0 });
      expect(scene.isRunning).toHaveBeenNthCalledWith(2, { value: 1 });
      expect(scene.isRunning).toHaveBeenNthCalledWith(3, { value: 2 });
      expect(scene.drawFrame).toHaveBeenCalledTimes(2);
      expect(scene.processStates).toHaveBeenCalledTimes(2);
      expect(scene.processStates).toHaveBeenNthCalledWith(1, 1, { value: 0 });
      expect(scene.processStates).toHaveBeenNthCalledWith(2, 1, { value: 1 });
      expect(scene.getNextScene).toHaveBeenCalledTimes(1);
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(getDelta).toHaveBeenCalledTimes(2);
    });

    it('does not have issue with getNextScene being undefined', async () => {
      const scene = mockScene();
      const cleanup = jest.fn();
      const getDelta = jest.fn();
      scene.isRunning.mockReturnValueOnce(false);

      const sceneParam: Scene<{ value: number }> = { ...scene, getNextScene: undefined, states: { value: 0 } };
      startSceneProcessing(sceneParam, cleanup, getDelta);

      await forEventQueueTicks(1);

      expect(scene.isRunning).toHaveBeenCalledTimes(1);
      expect(scene.isRunning).toHaveBeenNthCalledWith(1, { value: 0 });
      expect(scene.drawFrame).toHaveBeenCalledTimes(0);
      expect(scene.processStates).toHaveBeenCalledTimes(0);
      expect(scene.getNextScene).toHaveBeenCalledTimes(0);
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(getDelta).toHaveBeenCalledTimes(0);
    });

    it('runs the next scene when current scene is done', async () => {
      const scene = mockScene();
      const scene2 = mockScene();
      const cleanup = jest.fn();
      const getDelta = jest.fn();
      getDelta.mockReturnValue(1);
      scene.processStates.mockImplementation((delta, states) => ({ value: states.value + delta }));
      scene.isRunning.mockReturnValueOnce(true);
      scene.isRunning.mockReturnValueOnce(false);
      scene.getNextScene.mockReturnValueOnce({ ...scene2, states: { number: 55 } });
      scene2.processStates.mockImplementation((delta, states) => ({ number: states.number + delta }));
      scene2.isRunning.mockReturnValueOnce(true);
      scene2.isRunning.mockReturnValueOnce(false);

      const sceneParam: Scene<{ value: number }> = { ...scene, states: { value: 0 } };
      startSceneProcessing(sceneParam, cleanup, getDelta);

      await forEventQueueTicks(4);

      expect(scene.isRunning).toHaveBeenCalledTimes(2);
      expect(scene.isRunning).toHaveBeenNthCalledWith(1, { value: 0 });
      expect(scene.isRunning).toHaveBeenNthCalledWith(2, { value: 1 });
      expect(scene.drawFrame).toHaveBeenCalledTimes(1);
      expect(scene.processStates).toHaveBeenCalledTimes(1);
      expect(scene.processStates).toHaveBeenCalledWith(1, { value: 0 });
      expect(scene.getNextScene).toHaveBeenCalledTimes(1);
      expect(scene2.isRunning).toHaveBeenCalledTimes(2);
      expect(scene2.isRunning).toHaveBeenNthCalledWith(1, { number: 55 });
      expect(scene2.isRunning).toHaveBeenNthCalledWith(2, { number: 56 });
      expect(scene2.drawFrame).toHaveBeenCalledTimes(1);
      expect(scene2.processStates).toHaveBeenCalledTimes(1);
      expect(scene2.processStates).toHaveBeenCalledWith(1, { number: 55 });
      expect(scene2.getNextScene).toHaveBeenCalledTimes(1);
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(getDelta).toHaveBeenCalledTimes(2);
    });

    it('does not let two scene from running in parallel but allow sequential running', async () => {
      const scene = mockScene();
      const cleanup = jest.fn();
      const getDelta = jest.fn();
      scene.isRunning.mockReturnValue(false);

      const sceneParam: Scene<{ value: number }> = { ...scene, getNextScene: undefined, states: { value: 0 } };
      startSceneProcessing(sceneParam, cleanup, getDelta);
      expect(() => startSceneProcessing(sceneParam, cleanup, getDelta)).toThrow('Cannot run several scene in parallel');

      await forEventQueueTicks(1);

      expect(scene.isRunning).toHaveBeenCalledTimes(1);
      expect(scene.isRunning).toHaveBeenNthCalledWith(1, { value: 0 });
      expect(scene.drawFrame).toHaveBeenCalledTimes(0);
      expect(scene.processStates).toHaveBeenCalledTimes(0);
      expect(scene.getNextScene).toHaveBeenCalledTimes(0);
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(getDelta).toHaveBeenCalledTimes(0);

      Object.values(scene).forEach((mock) => mock.mockReset());
      cleanup.mockReset();
      const sceneParam2: Scene<{ value: number }> = { ...scene, getNextScene: undefined, states: { value: 99 } };
      startSceneProcessing(sceneParam2, cleanup, getDelta);

      await forEventQueueTicks(1);

      expect(scene.isRunning).toHaveBeenCalledTimes(1);
      expect(scene.isRunning).toHaveBeenNthCalledWith(1, { value: 99 });
      expect(scene.drawFrame).toHaveBeenCalledTimes(0);
      expect(scene.processStates).toHaveBeenCalledTimes(0);
      expect(scene.getNextScene).toHaveBeenCalledTimes(0);
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(getDelta).toHaveBeenCalledTimes(0);
    });
  });
});
