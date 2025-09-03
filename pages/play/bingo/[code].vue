<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BingoCard from "~/components/bingo/BingoCard.vue";
import { useBingo } from "~/composables/useBingo";

type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoCardType = Database["public"]["Tables"]["bingo_cards"]["Row"];

const route = useRoute();
const { joinGame } = useBingo();

const contestant = ref<BingoContestant | null>(null);
const cards = ref<BingoCardType[]>([]);
const loading = ref(true);
const error = ref("");

// Try joining with code from the URL
onMounted(async () => {
  try {
    const code = route.params.code as string;
    const result = await joinGame(code);

    if (result) {
      contestant.value = result.contestant;
      cards.value = result.cards;
    } else {
      error.value = "Invalid or expired join code.";
    }
  } catch (err: any) {
    console.error(err);
    error.value = "Failed to join game.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="p-4 space-y-6">
    <div v-if="loading" class="text-gray-400">Loading your cards...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <div v-else>
      <h1 class="text-2xl font-bold">
        Welcome, Contestant
        {{ contestant?.username || contestant?.id.slice(0, 6) }}
      </h1>
      <p class="text-sm text-gray-400">
        You have {{ cards.length }} card<span v-if="cards.length !== 1">s</span
        >.
      </p>

      <div class="grid gap-6 md:grid-cols-2">
        <BingoCard v-for="card in cards" :key="card.id" :card="card" />
      </div>

      <div class="mt-6">
        <UButton color="primary" class="w-full">Call Bingo!</UButton>
      </div>
    </div>
  </main>
</template>
