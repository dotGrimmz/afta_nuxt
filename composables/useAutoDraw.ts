// composables/useAutoDraw.ts
import { ref, onUnmounted } from "vue";

type AutoDrawOptions = {
  gameId: string | any;
  drawFn: (gameId: string) => Promise<void> | void; // don't expect return anymore
  getDraws: () => number[];
};

export function useAutoDraw({ gameId, drawFn, getDraws }: AutoDrawOptions) {
  const isRunning = ref(false);
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null);
  const intervalMs = ref(5000);

  const start = (ms?: number): void => {
    if (isRunning.value) stop();
    intervalMs.value = ms ?? intervalMs.value;

    console.log(
      `[autoDraw] START for game ${gameId.value} interval=${intervalMs.value}`
    );

    intervalId.value = setInterval(async () => {
      console.log("[autoDraw] tick");
      try {
        if (getDraws().length >= 75) {
          console.log("[autoDraw] all numbers drawn → stop");
          stop();
          return;
        }
        await drawFn(gameId.value); // let onDraw handle the rest
      } catch (err) {
        console.error("[autoDraw] ERROR in drawFn:", err);
        stop();
      }
    }, intervalMs.value);

    isRunning.value = true;
  };

  const stop = (): void => {
    if (intervalId.value) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }
    if (isRunning.value) {
      console.log(`[autoDraw] STOP for game ${gameId.value}`);
    }
    isRunning.value = false;
  };

  onUnmounted(() => {
    console.log("[autoDraw] cleanup on unmount");
    stop();
  });

  return { isRunning, intervalMs, start, stop };
}
