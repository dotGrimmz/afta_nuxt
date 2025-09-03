<script setup lang="ts">
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];

const props = defineProps<{
  game: BingoGame;
  draws: number[];
  winners: BingoCard[];
}>();

const emit = defineEmits<{
  (e: "draw", gameId: string): void;
  (e: "stop", gameId: string): void;
  (
    e: "confirm",
    payload: { gameId: string; cardId: string; contestantId: string }
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
    <div v-if="winners.length">
      <h4 class="font-medium mb-1">Winner Candidates</h4>
      <ul class="space-y-1">
        <li
          v-for="card in winners"
          :key="card.id"
          class="flex justify-between items-center bg-gray-800 p-2 rounded"
        >
          <span>
            Card {{ card.id.slice(0, 6) }} (Contestant
            {{ card.contestant_id.slice(0, 6) }})
          </span>
          <UButton
            size="xs"
            color="success"
            @click="
              emit('confirm', {
                gameId: game.id,
                cardId: card.id,
                contestantId: card.contestant_id,
              })
            "
          >
            Confirm Winner
          </UButton>
        </li>
      </ul>
    </div>
  </div>
</template>
