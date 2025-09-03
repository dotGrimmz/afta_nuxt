<script setup lang="ts">
import type { Database } from "~/types/supabase";

type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

const props = defineProps<{
  card: BingoCard;
  draws: number[];
}>();

type Grid = { numbers: number[][]; marked: boolean[][] };
const grid = computed(() => props.card.grid as Grid);

// Reactive helper to check if a cell should be marked
const isMarked = (row: number, col: number): boolean => {
  const num = grid.value.numbers[row][col];
  return grid.value.marked[row][col] || props.draws.includes(num);
};
</script>

<template>
  <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
    <div class="grid grid-cols-5 divide-x divide-y divide-gray-700">
      <template v-for="(row, r) in grid.numbers" :key="r">
        <div
          v-for="(num, c) in row"
          :key="c"
          class="flex items-center justify-center w-16 h-16 text-lg font-bold transition-colors duration-300"
          :class="isMarked(r, c) ? 'bg-green-600 text-white' : 'text-gray-200'"
        >
          <span v-if="num === 0">★</span>
          <span v-else>{{ num }}</span>
          <!-- Debug -->
          <small class="absolute bottom-1 right-1 text-[10px] text-gray-400">
            {{ isMarked(r, c) ? "✓" : "" }}
          </small>
        </div>
      </template>
    </div>
  </div>
</template>
