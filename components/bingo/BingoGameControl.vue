<script setup lang="ts">
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];
type WinnerCandidate = BingoCard & { payout?: number };

const props = defineProps<{
  game: BingoGame;
  draws: number[];
  winners: WinnerCandidate[]; // 👈 use extended type
}>();

const emit = defineEmits<{
  (e: "draw", gameId: string): void;
  (e: "stop", gameId: string): void;
  (
    e: "confirm",
    payload: {
      gameId: string;
      cardId: string;
      contestantId: string;
      payout: number; // 👈 add this here
    }
  ): void;
}>();
</script>

<template>
  <div class="mt-3 p-3 bg-gray-900 rounded border border-gray-700 space-y-3">
    <h3 class="font-semibold text-lg">Game Control</h3>

    <!-- Action buttons -->
    <div class="flex gap-2">
      <UButton
        v-if="game.status === 'active'"
        @click="emit('draw', game.id)"
        size="sm"
        color="primary"
      >
        Draw Number
      </UButton>

      <UButton
        v-if="game.status !== 'ended'"
        @click="emit('stop', game.id)"
        size="sm"
        color="error"
      >
        Stop Game
      </UButton>
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

    <!-- Winner candidates -->
    <div v-if="winners.length" class="space-y-2">
      <h3 class="text-lg font-semibold">Winner Candidates</h3>
      <div
        v-for="card in winners"
        :key="card.id"
        class="p-2 bg-gray-700 rounded space-y-2"
      >
        <div>Contestant: {{ card.contestant_id }}</div>
      </div>
    </div>
  </div>
</template>
