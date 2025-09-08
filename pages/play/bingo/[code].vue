<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BingoCard from "~/components/bingo/BingoCard.vue";
import { useBingo } from "~/composables/useBingo";
import { checkBingo } from "~/utils/bingo/checkBingo";
import type { _BingoCardType } from "~/types/bingo";

type BingoContestant = Database["public"]["Tables"]["bingo_contestants"]["Row"];
type BingoDraw = Database["public"]["Tables"]["bingo_draws"]["Row"];
type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"];
type BingoGame = {
  id: string;
  created_at: string;
  ended_at: string | null;
  min_players: number;
  status: string;
  payout?: number;
  winner_id?: string | null;
  winner_username?: string | null;
};
const route = useRoute();
const router = useRouter();

const supabase = useSupabaseClient<Database>();
const { joinGame, getState, callBingo } = useBingo();

const contestant = ref<BingoContestant | null>(null);
const cards = ref<_BingoCardType[]>([]);
const draws = ref<number[]>([]);
const winnerId = ref<string | null>(null);
const winnerName = ref<string | null>(null);
const winnerPayout = ref<number | null>(null);
const gameEnded = ref(false);
const gameLobby = ref(false);
const contestants = ref<BingoContestant[]>([]);
const isWinner = ref(false);

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
        const confirmed = payload.new as BingoGame;
        console.log("Bingo Winner Info Payload", payload);
        winnerId.value = confirmed?.winner_id || null;
        winnerPayout.value = confirmed.payout ?? 0;
        gameEnded.value = true; // game is over once result is inserted ✅
        isWinner.value = confirmed.winner_id === contestant.value?.id;
      }
    )
    .subscribe();
};

// ✅ Subscribe to game status
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
        const updated = payload.new as BingoGame;
        console.log({ updated });

        if (updated.status === "ended") {
          gameEnded.value = true;
          isWinner.value = updated.winner_id === contestant.value?.id;

          // if (!winnerId.value) {
          //   winnerName.value = updated?.winner_username; // admin stopped, no winner row
          // }
        }
      }
    )
    .subscribe();
};

const subscribeToContestants = (gameId: string) => {
  supabase
    .channel(`bingo_contestants_${gameId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bingo_contestants",
        filter: `game_id=eq.${gameId}`,
      },
      (payload) => {
        const newContestant =
          payload.new as Database["public"]["Tables"]["bingo_contestants"]["Row"];
        contestants.value = [...contestants.value, newContestant]; // 👈 update local list
      }
    )
    .subscribe();
};

// ✅ Handle "Call Bingo!"
const handleCallBingo = async (cardId: string) => {
  try {
    calling.value = true;

    const card = cards.value.find((c) => c.id === cardId);
    if (!card || !contestant.value) return;

    const hasBingo = checkBingo({ grid: card.grid, draws: draws.value });
    if (!hasBingo) {
      message.value = "No bingo yet — keep playing!";
      return;
    }

    const data = await callBingo(
      contestant.value.game_id,
      cardId,
      contestant.value.id,
      contestant.value.username
    );

    if (data) {
      gameEnded.value = true;
      isWinner.value = true;
      //@ts-ignore
      message.value = `Bingo! ${data.result.username} Won ${data.result.payout} 💎`;
      //@ts-ignore
      winnerName.value = data.result.username;
    }
  } catch (err: any) {
    console.error(err);
    message.value = err;
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
        if (state.game.game.status === "lobby") {
          gameLobby.value = true;
        }

        if (state.game.game.status === "ended") {
          const game = state.game.game;
          winnerName.value = game.winner_username;
          winnerId.value = game.winner_id;
          gameEnded.value = true;
          isWinner.value = game.winner_id === contestant.value?.id;
          winnerPayout.value = game.payout;
        }

        if (state) {
          draws.value = state.draws;
        }
        subscribeToDraws(gameId);
        subscribeToResults(gameId);
        subscribeToGame(gameId);
        subscribeToContestants(gameId);
      }
    } else {
      error.value = "Invalid or expired join code.";
    }
  } catch (err: any) {
    error.value = err?.message || "Could not join this game.";
  } finally {
    loading.value = false;
  }
});

const enterAnotherCode = (event: MouseEvent) => {
  event.preventDefault();
  router.push("/play/bingo");
};

console.log("game lobby??", gameLobby.value);

watch([gameEnded, winnerId], ([ended, winner]) => {
  console.log({ winner, ended, gameEnded, winnerId, contestant });
  if (ended) {
    if (contestant.value?.id === winner) {
      message.value = `🎉 You won this round!`;
    } else {
      message.value = "❌ Game Over — Better luck next time.";
    }
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

      <div class="flex justify-between">
        <p class="text-sm text-gray-400">
          You have {{ cards.length }} card<span v-if="cards.length !== 1"
            >s</span
          >.
        </p>
        <p>Prize: {{ winnerPayout }} 💎</p>
      </div>

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
          class="mt-2 w-full"
          color="primary"
          size="sm"
          :loading="calling"
          :disabled="gameEnded"
          @click="handleCallBingo(card.id)"
        >
          {{ gameEnded ? "Game Ended" : "Call Bingo" }}
        </UButton>
      </div>

      <!-- Winner / Game Over -->
      <div
        v-if="gameEnded"
        class="p-4 rounded text-center mt-6"
        :class="
          winnerId === contestant?.id
            ? 'bg-green-700 text-white'
            : 'bg-red-700 text-white'
        "
      >
        <template v-if="isWinner">
          🎉 Congratulations {{ winnerName }} — You Won!
          <div v-if="winnerPayout !== null" class="mt-2 text-lg font-bold">
            Prize: {{ winnerPayout }} 💎
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col gap-2">
            <span>❌ Game Over — Give it another shot!.</span>

            <UButton
              @click="enterAnotherCode"
              size="sm"
              class="text-center"
              color="primary"
              >Enter Another Code
            </UButton>
          </div>
          <div v-if="winnerPayout !== null" class="mt-2 text-sm">
            Prize: {{ winnerPayout }} 💎
          </div>
        </template>
      </div>

      <p v-if="message" class="text-xs text-green-400 mt-2">{{ message }}</p>
    </div>
  </main>
</template>
