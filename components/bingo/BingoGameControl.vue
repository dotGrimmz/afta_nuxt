<script setup lang="ts">
import type { _BingoCardType } from "~/types/bingo";
import type { Database } from "~/types/supabase";

type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"] & {
  payout?: number;
};
type BingoCard = Database["public"]["Tables"]["bingo_cards"]["Row"];
type WinnerCandidate = BingoCard & { payout?: number };
type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];

const props = defineProps<{
  game: BingoGame;
  draws: number[];
  winners: WinnerCandidate[];
  candidates?: _BingoCardType[];
  contestants?: BingoContestant[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "start", payload: { gameId: string; payout: number }): void;
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

// 👇 Track the reactive status so template always updates
const currentStatus = ref(props.game.status);

watch(
  () => props.game.status,
  (newStatus) => {
    currentStatus.value = newStatus;
  },
  { immediate: true }
);

if (currentStatus.value === "active") {
  console.log("current status:", toRaw(currentStatus.value));
}
</script>

<template>
  <div class="mt-3 p-3 bg-gray-900 rounded border border-gray-700 space-y-3">
    <h3 class="font-semibold text-lg">Game Control</h3>
    <div v-if="loading" class="text-gray-400 text-sm">
      Loading game state...
    </div>

    <!-- Admin Action buttons -->
    <div v-else class="flex gap-2 items-center">
      <!-- Lobby: Start + payout -->
      <template v-if="currentStatus === 'lobby'">
        <UInput
          v-model.number="game.payout"
          type="number"
          class="w-24 p-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
          placeholder="Payout"
        />
        <UButton
          size="sm"
          color="primary"
          @click="emit('start', { gameId: game.id, payout: game.payout || 0 })"
        >
          Start
        </UButton>
      </template>

      <!-- Active: Draw + Stop -->
      <template v-else-if="currentStatus === 'active'">
        <UButton @click="emit('draw', game.id)" size="sm" color="primary">
          Draw Number
        </UButton>
        <UButton @click="emit('stop', game.id)" size="sm" color="error">
          Stop Game
        </UButton>
      </template>

      <!-- Ended -->
      <template v-else-if="currentStatus === 'ended'">
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

    <!-- Contestant list -->
    <div v-if="contestants && contestants.length" class="space-y-2">
      <h3 class="text-lg font-semibold">Contestants</h3>
      <div
        v-for="c in contestants"
        :key="c.id"
        class="p-2 bg-gray-800 rounded space-y-1"
      >
        <div class="flex justify-between items-center">
          <span class="font-semibold">{{ c.username }}</span>
          <span class="text-xs text-gray-400">Code: {{ c.code }}</span>
        </div>
        <div class="text-sm text-gray-300">Cards: {{ c.num_cards }}</div>
        <div
          v-if="candidates?.some((card) => card.contestant_id === c.id)"
          class="text-yellow-400 text-sm font-semibold"
        >
          🚨 Bingo Called!
        </div>
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
          <span class="ml-2 text-gray-400 text-xs">
            (Card: {{ card.id.slice(0, 6) }})
          </span>
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
        class="p-3 bg-green-700 rounded text-white space-y-1"
      >
        <div class="font-semibold">Contestant: {{ card.contestant_id }}</div>
        <div class="text-sm text-gray-200">Card: {{ card.id.slice(0, 6) }}</div>
        <div class="text-lg font-bold">Prize: {{ card.payout ?? 0 }} 💎</div>
      </div>
    </div>
  </div>
</template>
