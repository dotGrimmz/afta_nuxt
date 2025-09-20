// ~/composables/useBingoStorage.ts
import { ref, watch, onMounted } from "vue";
import type { BingoCard } from "~/types/bingo";

export const useBingoStorage = () => {
  const ready = ref(false);
  const autoMark = ref(false);

  // --- Card grid persistence ---
  const restoreCardGrid = (card: BingoCard, draws: number[]): void => {
    const key = `bingo-grid-${card.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as boolean[][];
        if (Array.isArray(parsed)) {
          // restore persisted marks
          card.grid.marked = parsed;
        }
      } catch (err) {
        console.warn("Error restoring grid for card", card.id, err);
      }
    }

    // 🔑 sync with current draws (important for pulses)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const num = card.grid.numbers[r][c];
        // If number is drawn but unmarked, leave it unmarked (so pulseMap kicks in)
        if (draws.includes(num) && !card.grid.marked[r][c]) {
          // don’t flip it, just let pulseMap handle
        }
      }
    }
  };

  const persistCardGrid = (card: BingoCard): void => {
    const key = `bingo-grid-${card.id}`;
    localStorage.setItem(key, JSON.stringify(card.grid.marked));
  };

  // --- Global toggles (ready + autoMark) ---
  onMounted(() => {
    const storedReady = localStorage.getItem("bingo-ready");
    const storedAutoMark = localStorage.getItem("bingo-auto-mark");

    if (storedReady !== null) {
      ready.value = storedReady === "true";
    }
    if (storedAutoMark !== null) {
      autoMark.value = storedAutoMark === "true";
    }
  });

  watch(ready, (val) => {
    localStorage.setItem("bingo-ready", String(val));
  });

  watch(autoMark, (val) => {
    localStorage.setItem("bingo-auto-mark", String(val));
  });

  return {
    ready,
    autoMark,
    restoreCardGrid,
    persistCardGrid,
  };
};
