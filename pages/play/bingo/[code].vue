<script setup lang="ts">
import type { Database } from "~/types/supabase";
import { useBingo } from "~/composables/useBingo";
import type {
  BingoGameRow,
  BingoDrawRow,
  BingoCard,
  BingoResultRow,
  CallBingoResponse,
  ContestantType,
} from "~/types/bingo";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { checkBingo } from "~/utils/bingo/checkBingo";
import type { WatchStopHandle } from "vue";

const route = useRoute();
const router = useRouter();

const supabase = useSupabaseClient<Database>();

const { joinGame, getState, callBingo, narrowGame } = useBingo();

const contestant = ref<ContestantType | null>(null);
const cards = ref<BingoCard[]>([]);
const draws = ref<number[]>([]);

const currentGame = ref<BingoGameRow | null>(null);
const gameLobby = computed(() => currentGame.value?.status === "lobby");
const gameEnded = computed(() => currentGame.value?.status === "ended");
const winnerPayout = computed(() => currentGame.value?.payout ?? null);
const winnerId = computed(() => currentGame.value?.winner_id ?? null);
const winnerName = computed(() => currentGame.value?.winner_username ?? null);
const gameId = computed(() => currentGame.value?.id ?? null);
const isWinner = computed(
  () =>
    !!(
      currentGame.value?.winner_id &&
      currentGame.value?.winner_id === contestant.value?.id
    )
);

const contestants = ref<ContestantType[]>([]);

const autoMarkEnabled = computed(() => !!cards.value[0]?.auto_mark_enabled);
const freeSpaceEneabled = computed(() => cards.value[0].free_space);
console.log("automark enabled:", toRaw(autoMarkEnabled));

// the point of this is if the user has auto mark enabled from the cards object
// if autoMarkenabled is true, we give the option to toggle is via a swtich
// locally
const loading = ref(true);
const error = ref<string | null>(null);
const calling = ref(false);
const message = ref("");
const showBingoModal = ref(false);

const { $toast } = useNuxtApp();

const subscriptions: RealtimeChannel[] = [];
const refreshGameRow = async (gameId: string) => {
  const { data, error } = await supabase
    .from("bingo_games")
    .select("*")
    .eq("id", gameId)
    .single<BingoGameRow>();
  if (!error && data) currentGame.value = data;
};

const showBingoToast = (payout: number | string | undefined) => {
  $toast.success(`BINGO 🎉 ${payout} 💎`, {
    //@ts-ignore
    position: "top-left",
    timeout: 2000,
    closeOnClick: true,
    pauseOnHover: true,
  });
};

const enterAnotherCode = (event: MouseEvent) => {
  event.preventDefault();
  router.push("/play/bingo");
};

onMounted(async () => {
  try {
    const code = route.params.code as string;

    //**
    // when a contestant joins we fetch all their cards for the game id
    // and we also get their game code and we get their contestant data
    // but mainly we want the game_id so we can fetch that contestants game data
    // */
    const result = await joinGame(code);
    if (!result || !result.contestant || result.cards.length === 0) {
      error.value = "Invalid or expired join code.";
      return;
    }

    contestant.value = result.contestant;
    cards.value = result.cards;

    const gameId = result.contestant.game_id;
    if (!gameId) {
      error.value = "No game id on for contestant!";
      return;
    }

    // assign server game state to local game state
    const state = await getState(gameId);
    console.log("gamestate from mount ", state);
    // will just get the value of auto mark and free space from the first card

    console.log("auto mark enabled", cards.value[0].auto_mark_enabled);
    console.log("free space enabled", cards.value[0].free_space);

    // game state has 3 phases. lobby - pregame

    // assign server state to local state - should set defaults
    if (!state.game) {
      console.error("unable to assign server state to local state. Debug!");
      message.value = "unable to assign server state to local state. Debug!";
      return;
    }
    currentGame.value = narrowGame(state.game); // ✅ narrow status here
    // winnerPayout.value = state.game.payout ?? null;
    console.log(
      "server state assigned to current game in code.vue",
      toRaw(currentGame.value)
    );
    // Lobby- pregame state

    // Will this have the same reactive effect?
    //const gameLobby = computed(() => currentGame.value?.status === "lobby");

    // hydrate draws without replacing the array ref
    draws.value.splice(0, draws.value.length, ...state.draws.map((d) => d)); // if state.draws is already number[]

    // subscribe after hydration
    subscribeToDraws(gameId);
    subscribeToResults(gameId);
    subscribeToGame(gameId);
    subscribeToContestants(gameId);
  } catch (err: any) {
    error.value = err?.message || "Could not join this game.";
  } finally {
    loading.value = false;
  }
});

const subscribeToDraws = (gameId: string) => {
  const channel = supabase
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
        const newDraw = payload.new as BingoDrawRow;
        if (!draws.value.includes(newDraw.number)) {
          draws.value.push(newDraw.number);
        }
      }
    )
    .subscribe();
  subscriptions.push(channel);
};

const subscribeToResults = (gameId: string) => {
  const channel = supabase
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
        const confirmed = payload.new as BingoResultRow;
        console.log(
          "results updated and this is the updated payload",
          confirmed
        );
        await refreshGameRow(confirmed.game_id);
        console.log(currentGame.value);
      }
    )
    .subscribe();
  subscriptions.push(channel);
};

const subscribeToGame = (gameId: string) => {
  const channel = supabase
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
        const updated = payload.new as BingoGameRow;
        // Single source of truth:
        currentGame.value = updated;
      }
    )
    .subscribe();
  subscriptions.push(channel);
};

const subscribeToContestants = (gameId: string) => {
  const channel = supabase
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
        const newContestant = payload.new as ContestantType;
        contestants.value = [...contestants.value, newContestant];
      }
    )
    .subscribe();
  subscriptions.push(channel);
};

onBeforeUnmount(() => {
  subscriptions.forEach((sub) => supabase.removeChannel(sub));
  subscriptions.length = 0;
});

const lastSixDesc = computed(() => draws.value.slice(-6).reverse());
// const autoMarkOn = ref<boolean>(autoMarkEnabled.value ?? false);
const autoMarkOn = ref(false);
const ready = ref(false);

watch(
  autoMarkEnabled,
  (enabled) => {
    autoMarkOn.value = enabled;
  },
  { immediate: true }
);

let channel: RealtimeChannel | null = null;
let stopReadyWatch: WatchStopHandle | null = null;

const setUpLobbyChannel = (
  id: string,
  username: string,
  gameId: string
): void => {
  console.log("set up lobby channel running");
  if (channel) return; // already connected

  channel = supabase.channel(`lobby:${gameId}`, { config: { presence: {} } });

  channel
    .on("presence", { event: "sync" }, () => {
      console.log("[SYNC] presence:", channel!.presenceState());
    })
    .on("presence", { event: "join" }, ({ newPresences }) => {
      newPresences.forEach((p: any) =>
        console.log(`[JOIN/UPDATE] ${p.username} ready=${p.ready}`)
      );
    })
    .on("presence", { event: "leave" }, ({ leftPresences }) => {
      leftPresences.forEach((p: any) =>
        console.log(`[LEAVE] ${p.username} left`)
      );
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel!.track({ user_id: id, username, ready: ready.value });
      }
    });

  // re-track when the local toggle changes
  stopReadyWatch = watch(ready, (isReady) => {
    channel?.track({ user_id: id, username, ready: isReady });
    console.log(`[TOGGLE] ${username} ready=${isReady}`);
  });
};

// Wait for hydration (id, username, gameId) then setup once
watch(
  () =>
    [
      contestant.value?.id,
      contestant.value?.username,
      currentGame.value?.id,
    ] as const,
  ([id, username, gameId]) => {
    if (id && username && gameId) {
      console.log("set up lobbyy channel running");
      setUpLobbyChannel(id, username, gameId);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopReadyWatch?.();
  channel?.unsubscribe();
  channel = null;
});

// update presence whenever ready changes
watch(ready, (isReady) => {
  console.log("is ready", ready);
  if (channel && contestant.value?.id) {
    channel.track({
      user_id: contestant.value.id,
      username: contestant.value.username,
      ready: isReady,
    });
  }
});

// automark hook (ON = mark newest draw)
watch([() => draws.value.at(-1), autoMarkOn], ([latest, enabled]) => {
  if (!enabled || latest == null) return;

  console.log("[auto-mark] latest:", latest);

  for (const card of cards.value) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (card.grid.numbers[r][c] === latest) {
          card.grid.marked[r][c] = true;
        }
      }
    }
  }
});

// ✅ Handle "Call Bingo!"
const handleCallBingo = async (cardId: string) => {
  try {
    calling.value = true;

    const card = cards.value.find((c) => c.id === cardId);
    if (!card || !contestant.value) return;

    const hasBingo = checkBingo({ grid: card.grid, draws: draws.value });
    if (!hasBingo) {
      $toast.error("No bingo yet — keep playing!", {
        //@ts-ignore
        position: "top-left",
        timeout: 2000,
        closeOnClick: true,
        pauseOnHover: true,
      });
      return;
    }

    console.log("current game prior calling bingo:", currentGame.value);

    if (!currentGame.value?.payout)
      return (message.value = "Game Not Started!");
    const data: CallBingoResponse = await callBingo(
      contestant.value.game_id,
      cardId,
      contestant.value.id,
      contestant.value.username,
      currentGame.value.payout
    );

    if (data) {
      await refreshGameRow(data.game.id);

      message.value = `Bingo! ${data.result.username} Won ${data.result.payout} 💎`;

      showBingoToast(currentGame.value.payout);
    }
  } catch (err: any) {
    console.error(err);
    message.value = err;
  } finally {
    calling.value = false;
  }
};

const restoreMarks = (): void => {
  for (const card of cards.value) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const num = card.grid.numbers[r][c];
        // if this number was drawn already, mark it
        if (draws.value.includes(num)) {
          card.grid.marked[r][c] = true;
        }
      }
    }
  }
};

onUnmounted(() => {
  if (channel) {
    console.log("Cleaning up channel…");
    channel.unsubscribe();
    channel = null;
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
      <div class="flex justify-between">
        <h1 class="text-2xl font-bold">
          Welcome, {{ contestant?.username || contestant?.id.slice(0, 6) }}
        </h1>
        <div class="flex">
          <UButton
            label="Home"
            size="sm"
            variant="link"
            href="/dashboard/games"
          />
        </div>
      </div>

      <div class="flex justify-between mb-2">
        <div class="flex flex-col">
          <p class="text-sm text-gray-400">
            {{ cards.length }} Card <span v-if="cards.length !== 1">s</span>
            <span v-if="freeSpaceEneabled">✨Free Space</span>
          </p>
          <USwitch v-model="autoMarkOn" label="Toggle Automark" />
        </div>

        <div class="flex flex-col items-end">
          <p>Prize: {{ winnerPayout }} 💎</p>
          <USwitch v-if="gameLobby" v-model="ready" label="Ready not Play" />
        </div>
      </div>
      <!-- draws - I want to animate in and out each of these items --->
      <div class="p-4">
        <h2 class="text-xl font-bold mb-2">
          {{
            gameLobby ? "Waiting to Start" : gameEnded ? "Game Ended" : "Draws"
          }}
        </h2>

        <div v-if="!gameEnded" class="flex flex-wrap justify-between">
          <div
            v-for="(num, idx) in lastSixDesc"
            :key="`${num}-${idx}`"
            class="h-10 sm:h-11 md:h-12 aspect-square flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-base md:text-lg shadow-md select-none"
            :class="{
              'animate-pulse ring-2 ring-white/70 scale-105': idx === 0,
            }"
          >
            {{ num }}
          </div>
          <!-- "All" button that toggles modal -->
          <button
            type="button"
            class="h-10 sm:h-11 md:h-12 aspect-square flex items-center justify-center rounded-full border border-blue-600 text-blue-600 font-semibold text-sm md:text-base hover:bg-blue-600 hover:text-white transition"
            @click="showBingoModal = true"
          >
            All
          </button>
        </div>

        <BingoModal
          v-model="showBingoModal"
          title="All Numbers Drawn"
          :numbers="draws"
          :gameEnded="gameEnded"
          :restoreMarks="restoreMarks"
        />
      </div>
      <!-- Cards grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        <div
          v-for="card in cards"
          :key="card.id"
          class="bg-gray-800 p-4 rounded relative"
          :class="{
            'ring-4 ring-green-500': checkBingo({ grid: card.grid, draws }),
          }"
        >
          <BingoCard
            :autoMarkEnabled="autoMarkEnabled"
            :game-ended="gameEnded"
            :card="card"
            :draws="draws"
          />

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
          <div v-if="isWinner" class="mt-2 text-sm">
            Prize: {{ winnerPayout }} 💎
          </div>
        </template>
      </div>

      <p v-if="message" class="text-xs text-green-400 mt-2">{{ message }}</p>
    </div>
  </main>
</template>
