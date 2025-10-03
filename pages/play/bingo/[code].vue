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
import { checkBingoClient } from "~/utils/bingo/checkBingoClient";
import { checkBingo } from "~/utils/bingo/checkBingo";
import type { WatchStopHandle } from "vue";
import { useBingoStorage } from "~/composables/useBingoStorage";
import DrawBalls from "~/components/bingo/DrawBalls.vue";

const route = useRoute();
const router = useRouter();

const supabase = useSupabaseClient<Database>();

const { joinGame, getState, callBingo, narrowGame } = useBingo();

const contestant = ref<ContestantType | null>(null);
const cards = ref<BingoCard[]>([]);
const draws = ref<number[]>([]);
const disableInitialDrawAnimation = ref(false);

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
const { ready, autoMark, restoreCardGrid, persistCardGrid } = useBingoStorage();
const contestants = ref<ContestantType[]>([]);

const autoMarkEnabled = computed(() => !!cards.value[0]?.auto_mark_enabled);
const freeSpaceEneabled = computed(() => cards.value[0].free_space);

// the point of this is if the user has auto mark enabled from the cards object
// if autoMarkenabled is true, we give the option to toggle is via a swtich
// locally
const loading = ref(true);
const error = ref<string | null>(null);
const calling = ref(false);
const message = ref("");
const showBingoModal = ref(false);
const showAnimation = ref(false);
const showStartAnimation = ref(false);
const showAdminEndAnimation = ref(false);
const calledBingoSuccessfully = ref(false);
const gameStatus = computed(() => currentGame.value?.status ?? null);
let startAnimationTimeout: ReturnType<typeof setTimeout> | null = null;
let endAnimationTimeout: ReturnType<typeof setTimeout> | null = null;

const { $toast } = useNuxtApp();

const subscriptions: RealtimeChannel[] = [];
const getDrawStorageKey = (gameId: string) => `bingo-draws-${gameId}`;

const loadStoredDraws = (gameId: string): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getDrawStorageKey(gameId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "number")
      : [];
  } catch (err) {
    console.warn("Failed to load stored draws", err);
    return [];
  }
};

const persistStoredDraws = (gameId: string, numbers: number[]) => {
  if (typeof window === "undefined") return;
  try {
    const sanitized = numbers.filter((value) => typeof value === "number");
    window.localStorage.setItem(
      getDrawStorageKey(gameId),
      JSON.stringify(sanitized)
    );
  } catch (err) {
    console.warn("Failed to persist draws", err);
  }
};

const refreshGameRow = async (gameId: string) => {
  const { data, error } = await supabase
    .from("bingo_games")
    .select("*")
    .eq("id", gameId)
    .single<BingoGameRow>();
  if (!error && data) currentGame.value = data;
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
    for (const card of cards.value) {
      restoreCardGrid(card, draws.value);
    }
    // hydrate auto mark from local storage, fallback to server
    // autoMarkOn.value =
    //   autoMark.value || cards.value[0]?.auto_mark_enabled || false;
    const gameId = result.contestant.game_id;
    if (!gameId) {
      error.value = "No game id on for contestant!";
      return;
    }

    const storedDraws = loadStoredDraws(gameId);
    if (storedDraws.length) {
      draws.value.splice(0, draws.value.length, ...storedDraws);
      disableInitialDrawAnimation.value = true;
      for (const card of cards.value) {
        restoreCardGrid(card, draws.value);
      }
    } else {
      disableInitialDrawAnimation.value = false;
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
    const serverDraws = state.draws.map((d) => d);
    if (!disableInitialDrawAnimation.value) {
      draws.value.splice(0, draws.value.length, ...serverDraws);
    } else {
      const serverSet = new Set(serverDraws);
      const filtered = draws.value.filter((num) => serverSet.has(num));
      const merged = [...filtered];
      const seen = new Set(filtered);
      for (const num of serverDraws) {
        if (!seen.has(num)) {
          merged.push(num);
          seen.add(num);
        }
      }
      draws.value.splice(0, draws.value.length, ...merged);
    }

    if (currentGame.value?.id) {
      persistStoredDraws(currentGame.value.id, draws.value);
    }

    if (serverDraws.length === 0) {
      disableInitialDrawAnimation.value = false;
    }

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
  if (startAnimationTimeout) {
    clearTimeout(startAnimationTimeout);
    startAnimationTimeout = null;
  }
  if (endAnimationTimeout) {
    clearTimeout(endAnimationTimeout);
    endAnimationTimeout = null;
  }
});

// const autoMarkOn = ref<boolean>(autoMarkEnabled.value ?? false);
const autoMarkOn = ref(autoMarkEnabled.value ?? false);

watch(
  autoMarkEnabled,
  (enabled) => {
    autoMarkOn.value = enabled;
  },
  { immediate: true }
);

watch(autoMarkOn, (val) => {
  autoMark.value = val; // keep composable in sync
});

watch(gameStatus, (nextStatus, prevStatus) => {
  if (prevStatus === "lobby" && nextStatus === "active") {
    if (startAnimationTimeout) clearTimeout(startAnimationTimeout);
    showStartAnimation.value = true;
    startAnimationTimeout = setTimeout(() => {
      showStartAnimation.value = false;
      startAnimationTimeout = null;
    }, 3000);
  }

  if (
    prevStatus === "active" &&
    nextStatus === "ended" &&
    !calledBingoSuccessfully.value &&
    !isWinner.value
  ) {
    if (endAnimationTimeout) clearTimeout(endAnimationTimeout);
    showAdminEndAnimation.value = true;
    endAnimationTimeout = setTimeout(() => {
      showAdminEndAnimation.value = false;
      endAnimationTimeout = null;
    }, 3000);
  }
});

watch(
  draws,
  (values) => {
    const id = gameId.value;
    if (!id) return;
    persistStoredDraws(id, values);
  },
  { deep: true }
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
          persistCardGrid(card);
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

    const hasBingo = checkBingoClient(card.grid as any, draws.value);
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

    if (currentGame.value?.status === "ended")
      return (message.value = "Game Not Started!");
    const data: CallBingoResponse = await callBingo(
      contestant.value.game_id,
      cardId,
      contestant.value.id,
      contestant.value.username,
      currentGame.value?.payout
    );

    if (data) {
      calledBingoSuccessfully.value = true;
      await refreshGameRow(data.game.id);
      showAnimation.value = true;
      message.value = `Bingo! ${data.result.username} Won ${data.result.payout} 💎`;

      // showBingoToast(currentGame.value.payout);
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
    persistCardGrid(card);
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
    <!-- Jet (only rendered when animation starts) -->
    <section class="relative w-full h-screen">
      <Transition name="start-flash">
        <div
          v-if="showStartAnimation"
          class="absolute inset-0 z-30 flex items-center justify-center bg-black/70 pointer-events-none"
        >
          <div
            class="text-white text-4xl sm:text-5xl font-extrabold tracking-wide animate-pulse"
          >
            Game Starting!
          </div>
        </div>
      </Transition>
      <Transition name="end-flash">
        <div
          v-if="showAdminEndAnimation"
          class="absolute inset-0 z-30 flex items-center justify-center bg-black/70 pointer-events-none"
        >
          <div
            class="text-white text-4xl sm:text-5xl font-extrabold tracking-wide"
          >
            Game Ended
          </div>
        </div>
      </Transition>
      <BingoWin :visible="showAnimation" />

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
              href="/dashboard/profile"
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
            <USwitch v-model="ready" label="Ready Play" />
          </div>
        </div>
        <!-- draws - I want to animate in and out each of these items --->
        <div class="p-4">
          <h2 class="text-xl font-bold mb-2">
            {{
              currentGame?.status === "lobby"
                ? "Waiting to Start"
                : gameEnded
                ? "Game Ended"
                : "Draws"
            }}
          </h2>

          <div
            v-if="!gameEnded"
            class="flex flex-wrap w-full items-center gap-4"
          >
            <DrawBalls
              :numbers="draws"
              :disable-initial-animation="disableInitialDrawAnimation"
              class="flex-grow"
            />
            <!-- "All" button that toggles modal -->
            <UButton type="button" @click="showBingoModal = true">
              All
            </UButton>
          </div>

          <BingoModal
            v-model="showBingoModal"
            title="All Numbers Drawn"
            :numbers="draws"
            :game-ended="gameEnded"
            :restore-marks="restoreMarks"
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
              ref="bingoCardEl"
              :card="card"
              :draws="draws"
              :game-ended="gameEnded"
              :auto-mark-enabled="autoMarkOn"
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
                size="sm"
                class="text-center"
                color="primary"
                @click="enterAnotherCode"
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
    </section>
  </main>
</template>

<style scoped>
.start-flash-enter-active,
.start-flash-leave-active,
.end-flash-enter-active,
.end-flash-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.start-flash-enter-from,
.start-flash-leave-to,
.end-flash-enter-from,
.end-flash-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.start-flash-enter-to,
.start-flash-leave-from,
.end-flash-enter-to,
.end-flash-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
