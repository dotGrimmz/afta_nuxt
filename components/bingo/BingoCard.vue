<script setup lang="ts">
import BingoTile from "~/components/bingo/BingoTile.vue";
import type { Database } from "~/types/supabase";

type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];
type Grid = { numbers: number[][]; marked: boolean[][] };

const props = defineProps<{
  card: BingoCard;
  draws: number[];
  gameEnded: boolean;
  autoMarkEnabled: boolean;
}>();

const toNum = (v: unknown): number =>
  typeof v === "number" ? v : Number.parseInt(String(v), 10);
const grid = computed(
  () => props.card.grid as { numbers: number[][]; marked: boolean[][] }
);

const numbers = computed<number[][]>(() =>
  (grid.value.numbers ?? []).map((row) => row.map(toNum))
);

const pulseMap = computed<boolean[][]>(() =>
  numbers.value.map((row, r) =>
    row.map((n, c) => {
      if (props.gameEnded) return false;
      if (props.autoMarkEnabled) return false; // pulses only when manual
      if (isMarked(r, c)) return false;
      if (n === 0) return false; // free never pulses
      return drawsSet.value.has(n); // drawn but unpressed
    })
  )
);

const drawsSet = computed(() => new Set(props.draws.map(Number)));

const isFree = (r: number, c: number) => grid.value.numbers[r][c] === 0;
const isMarked = (r: number, c: number) => grid.value.marked[r][c] === true;

// Mark once (no toggle)
const markTile = (row: number, col: number): void => {
  if (props.gameEnded || props.autoMarkEnabled) return;
  if (isMarked(row, col) || isFree(row, col)) return;

  const n = numbers.value[row][col]; // 🔑 normalized
  if (drawsSet.value.has(n)) {
    grid.value.marked[row][col] = true;
  }
};

watch(
  () => props.draws.at(-1),
  (d) => {
    if (d == null) return;
    const last = toNum(d);
    let hit = false;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!isMarked(r, c) && numbers.value[r][c] === last) {
          hit = true;
          break;
        }
      }
    }
    console.log("[pulse check] latest:", last, "hasMatch:", hit);
  }
);
</script>

<template>
  <div
    class="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-2 sm:p-3 md:p-4"
  >
    <div class="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2">
      <template v-for="(row, r) in numbers" :key="`r-${r}`">
        <div v-for="(num, c) in row" :key="`c-${r}-${c}`" class="p-1">
          <BingoTile
            :value="num"
            :marked="isMarked(r, c)"
            :should-pulse="pulseMap[r][c]"
            :is-free="isFree(r, c)"
            @mark="markTile(r, c)"
          />
        </div>
      </template>
    </div>
  </div>
</template>
