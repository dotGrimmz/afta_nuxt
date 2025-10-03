<script setup lang="ts">
import type { BingoGameRow, ContestantType } from "~/types/bingo";
const props = defineProps<{
  gameStatus: BingoGameRow["status"];
  gameId: BingoGameRow["id"];
  draws: number[];
  contestants?: ContestantType[];
  loading?: boolean;
  autoDrawRunning: boolean;
  readyIds?: ContestantType["id"][];
}>();

const emit = defineEmits<{
  (e: "draw", gameId: string): void;
  (e: "stop", gameId: string): void;
  (e: "reloadGame"): void;
  (e: "removeContestant", contestantId: ContestantType["id"]): void;
}>();

// 👇 Track reactive status
console.log("current status ", props.gameStatus);
const readySet = computed<Set<string>>(() => new Set(props.readyIds ?? []));

const isReady = (c: ContestantType): boolean => {
  const key = (c as any).user_id ?? c.id;
  return key ? readySet.value.has(String(key)) : false;
};
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
        :disabled="props.gameStatus !== 'active' || props.autoDrawRunning"
        size="sm"
        color="primary"
        @click="emit('draw', props.gameId)"
      >
        Draw Number
      </UButton>
      <UButton
        :disabled="props.gameStatus !== 'active'"
        size="sm"
        color="error"
        @click="emit('stop', gameStatus)"
      >
        Stop Game
      </UButton>

      <template v-if="gameStatus === 'ended'">
        <UButton
          color="warning"
          size="sm"
          class="text-gray-400 text-sm"
          @click="emit('reloadGame')"
          >Game Ended - Refresh
        </UButton>
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
        :class="
          isReady(c) ? 'border-4 border-green-500' : 'border border-gray-700'
        "
      >
        <div class="flex justify-between items-center">
          <span class="font-semibold">{{ c.username }}</span>
          <span class="text-xs text-gray-400">Code: {{ c.code }}</span>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-300">Cards: {{ c.num_cards }}</div>
          <UButton
            label="View Card"
            :to="`/play/bingo/${c.code}`"
            target="_blank"
            rel="noopener noreferrer"
            color="info"
            variant="outline"
          />
          <UButton
            v-if="gameStatus === 'lobby'"
            size="sm"
            color="error"
            @click="emit('removeContestant', c.id)"
          >
            Remove Contestant
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
