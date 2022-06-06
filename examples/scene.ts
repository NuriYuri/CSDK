import r from 'raylib';
import { Scene, startSceneProcessing } from '../src/scene';

const screenWidth = 800;
const screenHeight = 450;
// tslint:disable-next-line: no-bitwise
r.SetConfigFlags(r.FLAG_VSYNC_HINT | r.FLAG_WINDOW_ALWAYS_RUN);
r.InitWindow(screenWidth, screenHeight, 'raylib [core] example - basic window');

type FpsSceneState = {
  frameCountSinceLastSecond: number;
  durationSinceLastSecond: number;
  FpsDuringLastSecond: number;
};
type FpsScene = Scene<FpsSceneState>;

const fpsScene: FpsScene = {
  processStates: (delta, states) => {
    const frameCountSinceLastSecond = states.frameCountSinceLastSecond + 1;
    const durationSinceLastSecond = states.durationSinceLastSecond + delta;

    if (durationSinceLastSecond < 1) {
      return { ...states, frameCountSinceLastSecond, durationSinceLastSecond };
    }

    return {
      frameCountSinceLastSecond: 0,
      durationSinceLastSecond: durationSinceLastSecond - 1,
      FpsDuringLastSecond: frameCountSinceLastSecond,
    };
  },
  drawFrame: ({ FpsDuringLastSecond }) => {
    r.BeginDrawing();
    r.ClearBackground(r.RAYWHITE);
    r.DrawText(`FPS: ${FpsDuringLastSecond}`, 0, 0, 20, r.ORANGE);
    r.EndDrawing();
  },
  isRunning: () => !r.WindowShouldClose(),
  states: {
    frameCountSinceLastSecond: 0,
    durationSinceLastSecond: 0,
    FpsDuringLastSecond: 0,
  },
};

type WaitingSceneState = { goToFps: boolean };
const waitingScene: Scene<WaitingSceneState> = {
  processStates: () => {
    return { goToFps: r.IsKeyPressed(r.KEY_ENTER) };
  },
  drawFrame: () => {
    r.BeginDrawing();
    r.ClearBackground(r.RAYWHITE);
    r.DrawText('Press enter to go to FPS', 0, 0, 20, r.BLUE);
    r.EndDrawing();
  },
  isRunning: ({ goToFps }) => !goToFps && !r.WindowShouldClose(),
  getNextScene: ({ goToFps }) => (goToFps ? fpsScene : undefined),
  states: { goToFps: false },
};

startSceneProcessing(waitingScene, r.CloseWindow, r.GetFrameTime);
