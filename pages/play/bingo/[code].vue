<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BingoCard from "~/components/bingo/BingoCard.vue";
import { useBingo } from "~/composables/useBingo";

type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoCardType = Database["public"]["Tables"]["bingo_cards"]["Row"];
type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];
type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"];

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const { joinGame, getState } = useBingo();

const contestant = ref<BingoContestant | null>(null);
const cards = ref<BingoCardType[]>([]);
const draws = ref<number[]>([]);
const winnerId = ref<string | null>(null);
const winnerName = ref<string | null>(null);
const loading = ref(true);
const error = ref("");

// Subscribe to realtime draws
const subscribeToDraws = (gameId: string) => {
  supabase
    .channel(`bingo_draws_${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bingo_draws",
        filter: `game_id=eq.${gameId}`,
      },
      (payload) => {
        const newDraw = payload.new as BingoDraw;
        if (!draws.value.includes(newDraw.number)) {
          draws.value.push(newDraw.number);
          console.log("New draw received:", newDraw.number);
        }
      }
    )
    .subscribe((status) => {
      console.log("Draws subscription status:", status);
    });
};

// Subscribe to confirmed winners
const subscribeToResults = (gameId: string) => {
  supabase
    .channel(`bingo_results_${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bingo_results",
        filter: `game_id=eq.${gameId}`,
      },
      async (payload) => {
        const confirmed = payload.new as BingoResult;
        console.log("Winner confirmed:", confirmed);

        winnerId.value = confirmed.contestant_id;

        // Fetch contestant details to show username
        const { data: winnerContestant, error } = await supabase
          .from("bingo_contestants")
          .select("username")
          .eq("id", confirmed.contestant_id)
          .single();

        if (error) {
          console.error("Failed to fetch winner username:", error.message);
          winnerName.value = confirmed.contestant_id;
        } else {
          winnerName.value =
            winnerContestant?.username || confirmed.contestant_id;
        }
      }
    )
    .subscribe((status) => {
      console.log("Results subscription status:", status);
    });
};

// Handle "Call Bingo!"
const callBingo = async () => {
  if (!contestant.value || cards.value.length === 0) return;
  const gameId = cards.value[0].game_id;

  try {
    await $fetch(`/api/bingo/games/${gameId}/call-bingo`, {
      method: "POST",
      body: { contestantId: contestant.value.id },
    });
    console.log("Bingo called by contestant:", contestant.value.username);
  } catch (err) {
    console.error("Failed to call bingo:", err);
  }
};

onMounted(async () => {
  try {
    const code = route.params.code as string;
    const result = await joinGame(code);

    if (result) {
      contestant.value = result.contestant;
      cards.value = result.cards;

      const gameId = result.cards[0]?.game_id;
      if (gameId) {
        // Load initial state
        const state = await getState(gameId);
        if (state) {
          draws.value = state.draws;
        }

        // Start realtime subscriptions
        subscribeToDraws(gameId);
        subscribeToResults(gameId);
      }
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
        Welcome, {{ contestant?.username || contestant?.id.slice(0, 6) }}
      </h1>
      <p class="text-sm text-gray-400">
        You have {{ cards.length }} card<span v-if="cards.length !== 1">s</span
        >.
      </p>

      <div class="grid gap-6 md:grid-cols-2">
        <BingoCard
          v-for="card in cards"
          :key="card.id"
          :card="card"
          :draws="draws"
        />
      </div>

      <div class="mt-6 space-y-4">
        <UButton
          v-if="!winnerId"
          color="primary"
          class="w-full"
          @click="callBingo"
        >
          Call Bingo!
        </UButton>

        <!-- Winner Banner -->
        <div
          v-if="winnerId"
          class="p-4 rounded text-center"
          :class="
            winnerId === contestant?.id
              ? 'bg-green-700 text-white'
              : 'bg-red-700 text-white'
          "
        >
          <template v-if="winnerId === contestant?.id">
            🎉 Congratulations {{ winnerName }} — You Won!
          </template>
          <template v-else>
            ❌ Game Over — {{ winnerName }} has already won.
          </template>
        </div>
      </div>
    </div>
  </main>
</template>
