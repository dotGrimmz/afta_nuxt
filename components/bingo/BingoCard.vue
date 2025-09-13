<script setup lang="ts">
import type { Database } from "~/types/supabase";

type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

const props = defineProps<{
  card: BingoCard;
  draws: number[];
  gameEnded: boolean;
  autoMarkEnabled: boolean;
}>();

type Grid = { numbers: number[][]; marked: boolean[][] };
const grid = computed(() => props.card.grid as Grid);

// ✅ Mark a tile manually (only if game not ended, number was drawn, and automark is OFF)
const markTile = (row: number, col: number): void => {
  if (props.gameEnded || props.autoMarkEnabled) return;

  const num = grid.value.numbers[row][col];
  if (props.draws.includes(num)) {
    grid.value.marked[row][col] = true;
  }
};

// ✅ A cell is marked only if `grid.marked` says so
const isMarked = (row: number, col: number): boolean => {
  return grid.value.marked[row][col];
};
</script>

<template>
  <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
    <div class="grid grid-cols-5 divide-x divide-y divide-gray-700">
      <template v-for="(row, r) in grid.numbers" :key="r">
        <div
          v-for="(num, c) in row"
          :key="c"
          class="flex items-center justify-center aspect-square text-lg font-bold transition-colors duration-300 cursor-pointer sm:text-xl md:text-2xl border border-gray-700"
          :class="isMarked(r, c) ? 'bg-green-600 text-white' : 'text-gray-200'"
          @click="markTile(r, c)"
        >
          <span v-if="num === 0">★</span>
          <span v-else>{{ num }}</span>
          <small class="absolute bottom-1 right-1 text-[10px] text-gray-400">
            {{ isMarked(r, c) ? "✓" : "" }}
          </small>
        </div>
      </template>
    </div>
  </div>
</template>
