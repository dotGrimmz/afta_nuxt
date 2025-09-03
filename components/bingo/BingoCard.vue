<script setup lang="ts">
import type { Database } from "~/types/supabase";

type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

const props = defineProps<{
  card: BingoCard;
}>();

// Cast grid JSON into usable types
type Grid = { numbers: number[][]; marked: boolean[][] };
const grid = computed(() => props.card.grid as Grid);
</script>

<template>
  <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
    <div class="grid grid-cols-5 divide-x divide-y divide-gray-700">
      <template v-for="(row, r) in grid.numbers" :key="r">
        <div
          v-for="(num, c) in row"
          :key="c"
          class="flex items-center justify-center w-16 h-16 text-lg font-bold"
          :class="
            grid.marked[r][c] ? 'bg-green-600 text-white' : 'text-gray-200'
          "
        >
          <!-- Free space shown as '★' -->
          <span v-if="num === 0">★</span>
          <span v-else>{{ num }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
