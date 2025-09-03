<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BingoCard from "~/components/bingo/BingoCard.vue";
import { useBingo } from "~/composables/useBingo";
import { checkBingo } from "~/utils/bingo/checkBingo";
import type { _BingoCardType } from "~/types/bingo";

type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];
type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"];
type BingoGame = Database["public"]["Tables"]["bingo_games"]["Row"];

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const { joinGame, getState, callBingo } = useBingo();

const contestant = ref<BingoContestant | null>(null);
const cards = ref<_BingoCardType[]>([]);
const draws = ref<number[]>([]);
const winnerId = ref<string | null>(null);
const winnerName = ref<string | null>(null);
const payout = ref<number | null>(null);
const gameStatus = ref<"lobby" | "active" | "ended" | string>("lobby");
const gameEnded = ref(false);
const winnerPayout = ref<number | null>(null); // 👈 payout for winner

const loading = ref(true);
const error = ref<string | null>(null);
const calling = ref(false);
const message = ref("");

// ✅ Subscribe to realtime draws
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
        }
      }
    )
    .subscribe();
};

// ✅ Subscribe to confirmed winners
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
        winnerPayout.value = confirmed.payout ?? 0; // 👈 capture payout

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

// ✅ Subscribe to game status (so losers see "Game Over")
// Subscribe to game status (ended, etc.)
const subscribeToGame = (gameId: string) => {
  supabase
    .channel(`bingo_games_${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bingo_games",
        filter: `id=eq.${gameId}`,
      },
      (payload) => {
        const updated =
          payload.new as Database["public"]["Tables"]["bingo_games"]["Row"];
        console.log("Game update received:", updated);

        if (updated.status === "ended") {
          gameEnded.value = true; // 👈 mark locally
          if (!winnerId.value) {
            winnerName.value = "Another player";
          }
          cards.value.forEach((c) => {
            c.is_winner_candidate = false;
          });
        }
      }
    )
    .subscribe((status) => {
      console.log("Game subscription status:", status);
    });
};

// ✅ Handle "Call Bingo!"
const handleCallBingo = async (cardId: string) => {
  try {
    calling.value = true;
    if (contestant.value) {
      await callBingo(contestant.value.game_id, cardId, contestant.value.id);
      message.value = "Bingo called! Waiting for host confirmation...";
      const card = cards.value.find((c: any) => c.id === cardId);
      if (card) {
        card.is_winner_candidate = true;
      }
    }
  } catch (err: any) {
    message.value = err.message || "Error calling bingo.";
  } finally {
    calling.value = false;
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
        const state = await getState(gameId);
        if (state) {
          draws.value = state.draws;
        }

        // Start realtime subs
        subscribeToDraws(gameId);
        subscribeToResults(gameId);
        subscribeToGame(gameId);
      }
    } else {
      error.value = "Invalid or expired join code.";
    }
  } catch (err: any) {
    error.value =
      err?.data?.statusMessage ||
      err?.message ||
      "Could not join this game. It may have already started.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="p-4 space-y-6">
    <div v-if="loading" class="text-gray-400">Loading your cards...</div>

    <div
      v-else-if="error"
      class="p-3 rounded bg-red-700 text-white text-center"
    >
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-2xl font-bold">
        Welcome, {{ contestant?.username || contestant?.id.slice(0, 6) }}
      </h1>
      <p class="text-sm text-gray-400">
        You have {{ cards.length }} card<span v-if="cards.length !== 1">s</span
        >.
      </p>

      <!-- Cards grid -->
      <div
        v-for="card in cards"
        :key="card.id"
        class="bg-gray-800 p-4 rounded relative"
        :class="{
          'ring-4 ring-green-500': checkBingo({ grid: card.grid, draws }),
        }"
      >
        <BingoCard :card="card" :draws="draws" />

        <UButton
          v-if="!gameEnded"
          class="mt-2 w-full"
          color="primary"
          size="sm"
          :loading="calling"
          :disabled="
            card.is_winner_candidate || !checkBingo({ grid: card.grid, draws })
          "
          @click="handleCallBingo(card.id)"
        >
          {{ card.is_winner_candidate ? "Bingo Called" : "Call Bingo" }}
        </UButton>
      </div>

      <!-- Winner Banner -->
      <!-- Winner Banner -->
      <div
        v-if="winnerId"
        class="p-4 rounded text-center mt-6"
        :class="
          winnerId === contestant?.id
            ? 'bg-green-700 text-white'
            : 'bg-red-700 text-white'
        "
      >
        <template v-if="winnerId === contestant?.id">
          🎉 Congratulations {{ winnerName }} — You Won!
          <div v-if="winnerPayout !== null" class="mt-2 text-lg font-bold">
            Prize: {{ winnerPayout }} 💎
          </div>
        </template>
        <template v-else>
          ❌ Game Over — {{ winnerName }} has already won.
          <div v-if="winnerPayout !== null" class="mt-2 text-sm">
            Prize: {{ winnerPayout }} 💎
          </div>
        </template>
      </div>

      <!-- Status message -->
      <p v-if="message" class="text-xs text-green-400 mt-2">{{ message }}</p>
    </div>
  </main>
</template>
