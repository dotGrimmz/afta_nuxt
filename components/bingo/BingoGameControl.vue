<script setup lang="ts">
import type { _BingoCardType } from "~/types/bingo";
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"] & {
  payout?: number;
};
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];
type WinnerCandidate = BingoCard & { payout?: number };

const props = defineProps<{
  game: BingoGame;
  draws: number[];
  winners: WinnerCandidate[]; // confirmed winners
  candidates?: _BingoCardType[]; // 👈 new optional prop for players who called bingo
  loading?: boolean;
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
      payout: number;
    }
  ): void;
}>();
</script>

<template>
  <div class="mt-3 p-3 bg-gray-900 rounded border border-gray-700 space-y-3">
    <h3 class="font-semibold text-lg">Game Control</h3>
    <div v-if="loading" class="text-gray-400 text-sm">
      Loading game state...
    </div>

    <!-- Action buttons -->
    <div v-else class="flex gap-2">
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

    <!-- Bingo Calls (candidates) -->
    <div v-if="candidates && candidates.length" class="space-y-2">
      <h3 class="text-lg font-semibold">Bingo Calls</h3>
      <div
        v-for="card in candidates"
        :key="card.id"
        class="p-2 bg-gray-700 rounded space-y-2 flex justify-between items-center"
      >
        <div>
          Contestant: {{ card.contestant_id }}
          <span class="ml-2 text-gray-400 text-xs"
            >(Card: {{ card.id.slice(0, 6) }})</span
          >
        </div>
        <UButton
          size="xs"
          color="primary"
          @click="
            emit('confirm', {
              gameId: game.id,
              cardId: card.id,
              contestantId: card.contestant_id,
              payout: game.payout || 0,
            })
          "
        >
          Confirm
        </UButton>
      </div>
    </div>

    <!-- Confirmed winners -->
    <div v-if="winners.length" class="space-y-2">
      <h3 class="text-lg font-semibold">Confirmed Winners</h3>
      <div
        v-for="card in winners"
        :key="card.id"
        class="p-2 bg-green-700 rounded space-y-2 text-white"
      >
        <div>Contestant: {{ card.contestant_id }}</div>
        <div>Prize: {{ card.payout || 0 }}</div>
      </div>
    </div>
  </div>
</template>
