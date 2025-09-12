<script setup lang="ts">
import type { Database } from "~/types/supabase";
import type {
  BingoGameRow,
  ContestantType,
  BingoCard,
  BingoDrawRow,
  BingoCardRow,
  BingoCardGrid,
  GameStateResponse,
} from "~/types/bingo";
const props = defineProps<{
  game: BingoGameRow;
  draws: number[];
  contestants?: ContestantType[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "draw", gameId: string): void;
  (e: "stop", gameId: string): void;
}>();

// 👇 Track reactive status
const currentStatus = ref(props.game.status);
console.log("game", props.game);
</script>

<template>
  <div class="mt-3 p-3 bg-gray-900 rounded border border-gray-700 space-y-3">
    <h3 class="font-semibold text-lg">Game Control</h3>

    <div v-if="loading" class="text-gray-400 text-sm">
      Loading game state...
    </div>

    <!-- Admin buttons -->
    <div v-else class="flex gap-2 items-center">
      <UButton
        :disabled="currentStatus !== 'active'"
        @click="emit('draw', game.id)"
        size="sm"
        color="primary"
      >
        Draw Number
      </UButton>
      <UButton
        :disabled="currentStatus !== 'active'"
        @click="emit('stop', game.id)"
        size="sm"
        color="error"
      >
        Stop Game
      </UButton>

      <template v-if="currentStatus === 'ended'">
        <span class="text-gray-400 text-sm">Game Ended</span>
      </template>
    </div>

    <!-- Drawn numbers -->
    <div>
      <h4 class="font-medium mb-1">Drawn Numbers</h4>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="num in draws"
          :key="num"
          class="px-2 py-1 rounded bg-gray-700 text-sm"
        >
          {{ num }}
        </span>
      </div>
    </div>

    <!-- Contestants -->
    <div v-if="contestants && contestants.length" class="space-y-2">
      <h3 class="text-lg font-semibold">Contestants</h3>
      <div
        v-for="c in contestants"
        :key="c.id"
        class="p-2 bg-gray-800 rounded space-y-1"
      >
        <div class="flex justify-between items-center">
          <!-- <span class="font-semibold">{{ c.username }}</span>
          <span class="text-xs text-gray-400">Code: {{ c.code }}</span> -->
        </div>
        <!-- <div class="text-sm text-gray-300">Cards: {{ c.num_cards }}</div> -->
      </div>
    </div>

    <!-- Confirmed winners -->
    <!-- deprecated. we no longer need to see confirmed winners? -->
    <!-- <div v-if="winners.length" class="space-y-2">
      <h3 class="text-lg font-semibold">Confirmed Winners</h3>
      <div
        v-for="card in winners"
        :key="card.id"
        class="p-3 bg-green-700 rounded text-white space-y-1"
      >
        <div class="font-semibold">Contestant: {{ card.contestant_id }}</div>
        <div class="text-sm text-gray-200">Card: {{ card.id.slice(0, 6) }}</div>
        <div class="text-lg font-bold">Prize: {{ card.payout ?? 0 }} 💎</div>
      </div>
    </div> -->
  </div>
</template>
