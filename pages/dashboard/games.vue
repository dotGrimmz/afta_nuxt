<script setup lang="ts">
import type { Database } from "~/types/supabase";
import { calculateCost } from "~/utils/bingo/pricing";
import BaseModal from "~/components/BaseModal.vue";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { sub } from "three/tsl";

const supabase = useSupabaseClient<Database>();
const { profile } = useProfile();

// Trivia composable (unchanged)
const {
  games: triviaGames,
  visibleGames: visibleTriviaGames,
  loading: triviaLoading,
  creating: triviaCreating,
  message: triviaMessage,
  createGame: createTriviaGame,
  startGame: startTriviaGame,
  joinGame: joinTriviaGame,
} = useTrivia();

const newTriviaTitle = ref("");

// Bingo composable (new)
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

type ContestantType =
  Database["public"]["Tables"]["bingo_contestants"]["Row"][];
type BingoResult = Database["public"]["Tables"]["bingo_results"]["Row"] & {
  username?: string;
};

const {
  games: bingoGames,
  loading: bingoLoading,
  creating: bingoCreating,
  message: bingoMessage,
  createGame: createBingoGame,
  startGame: startBingoGame,
  stopGame,
  drawNumber,
  joinGame: joinBingoGame,
  getState,
  issueJoinCode,
  getContestants,
  refresh: refreshBingo,
} = useBingo() as {
  refresh: () => void;
  games: Ref<BingoGame[]>;
  loading: Ref<boolean>;
  creating: Ref<boolean>;
  message: Ref<string>;
  createGame: () => void;
  startGame: (id: string, payout: number) => void;
  stopGame: (id: string) => void;
  drawNumber: (id: string) => void;
  confirmWinner: (
    gameId: string,
    cardId: string,
    contestantId: string,
    payout: number
  ) => void;
  joinGame: (id: string) => void;
  getState: (
    id: string
  ) => Promise<{ draws: number[]; winners: any[]; contestants: any[] }>;
  issueJoinCode: (
    gameId: string,
    username: string,
    numCards: number,
    freeSpace: boolean,
    autoMark: boolean
  ) => Promise<{ contestant: any; code: string; cards: any[] }>;
  getContestants: (gameId: string) => Promise<any[]>;
};

const stateMap = ref<
  Record<
    string,
    {
      draws: number[];
      winners: any[];
      contestants?: any[];
      candidates?: any[];
      loading: boolean;
    }
  >
>({});

// For issuing join codes
const newContestant = reactive({
  username: "",
  numCards: 1,
  freeSpace: false,
  autoMark: false,
});
type RTESubs = {
  channel: RealtimeChannel;
  id: string;
};
const lastIssuedCode = ref<string | null>(null);
const gameEnded = ref(false);
const overlay = useOverlay();
const subscriptions: RTESubs[] = [];

const modal = overlay.create(BaseModal);
const open = async (
  username: string,
  winner_id: string,
  payout: string | number
) => {
  const instance = modal.open({
    winner_id,
    payout,
    winner_username: username,
  });

  const shouldRefresh = await instance.result;

  if (shouldRefresh) {
    refreshBingo();
  }
};
const handleIssueCode = async (gameId: string) => {
  try {
    const { code } = await issueJoinCode(
      gameId,
      newContestant.username,
      newContestant.numCards,
      newContestant.freeSpace,
      newContestant.autoMark
    );

    lastIssuedCode.value = code;

    // reset form
    newContestant.username = "";
    newContestant.numCards = 1;
    newContestant.freeSpace = false;
    newContestant.autoMark = false;
  } catch (err) {
    console.error("Error issuing join code:", err);
  }
};

const refreshGameState = async (gameId: string) => {
  stateMap.value[gameId] = {
    ...(await getState(gameId)),
    loading: false,
  };
};

onMounted(async () => {
  if (bingoGames.value) {
    const newState: Record<string, any> = {};

    for (const game of bingoGames.value) {
      newState[game.id] = {
        ...(await getState(game.id)),
        contestants: await getContestants(game.id),
      };
    }

    // 👈 replace the whole object so Vue reactivity kicks in
    stateMap.value = newState;
  }
});
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
        const newContestant =
          payload.new as Database["public"]["Tables"]["bingo_contestants"]["Row"];

        stateMap.value[gameId] = {
          ...(stateMap.value[gameId] || {
            draws: [],
            winners: [],
            candidates: [],
            contestants: [],
          }),
          contestants: [
            ...(stateMap.value[gameId]?.contestants || []),
            newContestant,
          ],
          loading: false,
        };
      }
    )
    .subscribe();
  subscriptions.push({ id: gameId, channel });
};

const subscribeToResults = (gameId: string) => {
  console.log("subscribing to ", gameId);
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
        const confirmed = payload?.new as BingoResult;
        console.log("Bingo Winner Info Payload", payload);
        console.log("Bingo Winner Info confirmed", confirmed);

        // if the new result has a winner name then we open the modal
        if (confirmed.username) {
          open(
            confirmed.username ?? confirmed.contestant_id,
            confirmed.contestant_id ?? confirmed.contestant_id,
            confirmed.payout ?? confirmed.payout
          );
        }
        // confirmed  = {
        //card_id
        // :
        // "8b13d766-d45d-4794-9b72-b7acb3bfb874"
        // contestant_id
        // :
        // "90bce1b5-ccc1-4722-bc4a-40e5c17cf5e4"
        // created_at
        // :
        // "2025-09-08T11:31:44.658676+00:00"
        // game_id
        // :
        // "99e8d2b6-a1b4-4224-a5d0-eabc9e5fd78d"
        // id
        // :
        // "6e3555ab-312b-40a0-9dbe-dd217eef88c5"
        // payout
        // :
        // 0
        // username
        // :
        // "tae"
        // won_at
        // :
        // "2025-09-08T11:31:44.658676+00:00" }

        //   .from("bingo_contestants")
        //   .select("username")
        //   .eq("id", confirmed.contestant_id)
        //   .single();

        // winnerName.value =
        //   winnerContestant?.username || confirmed.contestant_id;

        // console.log(
        //   "winner name value after winner bingo results called cus a winner is selected:",
        //   winnerName.value
        // );

        // we can just check gamestate here in this ref,
      }
    )
    .subscribe();
  subscriptions.push({ id: gameId, channel });
};

watch(
  // in this watcher we subscribe to all the games in bingo games,
  // but when this watcher of bingo games updates, we need to also
  // unsub from that game as well. this should be checked on
  // every new bingo game and when this component unmounts.
  bingoGames,
  async (games) => {
    if (!games || games.length === 0) return;
    console.log("subscriptions", subscriptions);
    const gameIds = games.map((game) => game.id);
    subscriptions.forEach((sub) => {
      console.log("currently subbed:", sub);
      if (gameIds.includes(sub.id)) {
        sub.channel.unsubscribe();
      }
    });

    const newState: Record<string, any> = {};
    for (const game of games) {
      newState[game.id] = {
        draws: [],
        winners: [],
        candidates: [],
        contestants: [],
      };

      const fullState = await getState(game.id);

      newState[game.id] = { ...fullState, loading: false };
      subscribeToContestants(game.id); // 👈 start realtime sync
      subscribeToResults(game.id);
    }
    stateMap.value = newState;
  },
  { immediate: true }
);

const recentResults = ref<any[]>([]);
const recentResultsLoading = ref(true);

onMounted(async () => {
  try {
    const data = await $fetch<any>("/api/bingo/results/recent");

    recentResults.value = data;
  } catch (err) {
    console.error("Failed to fetch results", err);
  } finally {
    recentResultsLoading.value = false;
  }
});

onMounted(() => {
  if (!bingoGames.value) return;

  // Subscribe to realtime updates on bingo_games
  bingoGames.value.forEach((game) => {
    supabase
      .channel(`bingo_games_${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bingo_games",
          filter: `id=eq.${game.id}`,
        },
        async (payload) => {
          const updated =
            payload.new as Database["public"]["Tables"]["bingo_games"]["Row"];
          console.log("[Realtime] Game update:", updated);

          // Refresh state for that game
          stateMap.value[updated.id] = {
            ...(await getState(updated.id)),
            loading: false,
          };
        }
      )
      .subscribe();
  });
});

onBeforeUnmount(() => {
  console.log("onBeforeUnmount", subscriptions);
  subscriptions.forEach((sub) => {
    console.log("unsubscribing from", sub);
    supabase.removeChannel(sub.channel);
  });
  subscriptions.length = 0; // clear refs
});
</script>

<template>
  <main class="p-2 space-y-8">
    <!-- Trivia Games Section -->
    <section>
      <h1 class="text-2xl font-bold mb-2">Trivia Games</h1>

      <!-- Admin-only: Create Trivia Game -->
      <div
        v-if="profile?.role === 'admin'"
        class="bg-gray-800 p-4 rounded space-y-3"
      >
        <label class="block">
          <span class="text-sm text-gray-300">Game Title</span>
          <input
            v-model="newTriviaTitle"
            type="text"
            class="w-full mt-1 p-2 rounded bg-gray-900 border border-gray-600 text-white"
            placeholder="Enter a game title"
          />
        </label>

        <UButton
          :loading="triviaCreating"
          :disabled="!newTriviaTitle.trim()"
          @click="createTriviaGame(newTriviaTitle)"
          color="primary"
          class="w-full"
        >
          Create Game
        </UButton>

        <p v-if="triviaMessage" class="text-sm mt-2">{{ triviaMessage }}</p>
      </div>

      <!-- Loading -->
      <div v-if="triviaLoading">Loading games...</div>

      <!-- No games -->
      <div v-else-if="visibleTriviaGames.length === 0" class="text-gray-400">
        <span v-if="profile?.role === 'admin'">
          No trivia games created yet. Create one to get started!
        </span>
        <span v-else> No live trivia games available right now. </span>
      </div>

      <!-- Games list -->
      <div v-else>
        <div
          v-for="game in visibleTriviaGames"
          :key="game.id"
          class="p-2 my-2 bg-gray-800 rounded flex justify-between items-center"
        >
          <div>
            <p class="font-semibold">{{ game.title }}</p>
            <p class="text-sm text-gray-400">Status: {{ game.status }}</p>
          </div>

          <div class="flex gap-2">
            <template v-if="profile?.role === 'admin'">
              <UButton :to="`/play/${game.id}`" size="sm">Open</UButton>
              <UButton
                v-if="game.status === 'lobby'"
                @click="startTriviaGame(game.id)"
                size="sm"
                color="primary"
              >
                Start
              </UButton>
              <UButton v-if="game.status !== 'ended'" size="sm" color="error">
                End
              </UButton>
            </template>

            <template v-else>
              <UButton
                @click="joinTriviaGame(game.id)"
                size="sm"
                color="primary"
              >
                Join
              </UButton>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- Bingo Games Section -->
    <section>
      <h1 class="text-2xl font-bold mb-2">Bingo Games</h1>

      <!-- Admin-only: Create Bingo Game -->
      <div
        v-if="profile?.role === 'admin'"
        class="bg-gray-800 p-4 rounded space-y-3"
      >
        <UButton
          :loading="bingoCreating"
          @click="createBingoGame()"
          color="primary"
          class="w-full"
        >
          Create Game
        </UButton>

        <p v-if="bingoMessage" class="text-sm mt-2">{{ bingoMessage }}</p>
      </div>

      <!-- Loading -->
      <div v-if="bingoLoading">Loading games...</div>

      <!-- No games -->
      <div
        v-else-if="!bingoGames || bingoGames.length === 0"
        class="text-gray-400"
      >
        <span v-if="profile?.role === 'admin'">
          No bingo games created yet. Create one to get started!
        </span>
        <span v-else> No live bingo games available right now. </span>
      </div>

      <!-- Games list -->
      <div v-else>
        <div
          v-for="(game, index) in bingoGames"
          :key="game.id"
          class="p-2 my-2 bg-gray-800 rounded"
        >
          <!-- Game header -->
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold">
                Bingo Game – # {{ bingoGames.length - index }}
              </p>
              <p class="text-sm text-gray-400">Status: {{ game.status }}</p>
            </div>

            <!-- Inline: Start & payout input -->
            <div v-if="profile?.role === 'admin'" class="flex gap-2">
              <UInput
                v-if="game.status === 'lobby'"
                v-model.number="game.payout"
                type="number"
                class="w-24 p-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
                placeholder="Payout"
              />

              <UButton
                v-if="game.status === 'lobby'"
                @click="startBingoGame(game.id, game.payout || 0)"
                size="sm"
                color="primary"
              >
                Start
              </UButton>
            </div>
          </div>

          <!-- Issue Join Code panel -->
          <div
            v-if="profile?.role === 'admin' && game.status === 'lobby'"
            class="mt-4 bg-gray-700 p-3 rounded"
          >
            <h3 class="text-sm font-semibold text-gray-200 mb-2">
              Issue Join Code
            </h3>

            <div class="grid grid-cols-2 gap-2">
              <UInput
                v-model="newContestant.username"
                placeholder="Username"
                size="sm"
                class="bg-gray-900 border border-gray-600 text-white"
              />
              <UInput
                v-model.number="newContestant.numCards"
                type="number"
                min="1"
                placeholder="Cards"
                size="sm"
                class="bg-gray-900 border border-gray-600 text-white"
              />

              <label class="flex items-center text-xs text-gray-300 space-x-1">
                <input v-model="newContestant.freeSpace" type="checkbox" />
                <span>Free Space</span>
              </label>
              <label class="flex items-center text-xs text-gray-300 space-x-1">
                <input v-model="newContestant.autoMark" type="checkbox" />
                <span>Auto Mark</span>
              </label>
            </div>

            <p class="text-xs text-gray-400 mt-2">
              Expected Cost:
              {{
                calculateCost(
                  newContestant.numCards || 0,
                  newContestant.freeSpace || false
                )
              }}
              diamonds
            </p>

            <UButton
              class="mt-2 w-full"
              size="sm"
              color="primary"
              @click="handleIssueCode(game.id)"
            >
              Generate Code
            </UButton>

            <p v-if="lastIssuedCode" class="text-xs text-green-400 mt-2">
              Code issued: {{ lastIssuedCode }} for
            </p>
          </div>

          <!-- Admin control panel -->

          <!-- in this, do the actions do something to state that is bad? things
          things arent being updated  -->
          <BingoGameControl
            v-if="profile?.role === 'admin'"
            :game="game"
            :draws="stateMap[game.id]?.draws || []"
            :winners="stateMap[game.id]?.winners || []"
            :contestants="stateMap[game.id]?.contestants || []"
            :loading="stateMap[game.id]?.loading"
            @draw="
              async (gameId) => {
                await drawNumber(gameId);

                stateMap[gameId] = {
                  ...(await getState(gameId)),
                  loading: false,
                };
              }
            "
            @stop="
              async (gameId) => {
                await stopGame(gameId);
                stateMap[gameId] = {
                  ...(await getState(gameId)),
                  loading: false,
                };
              }
            "
          />

          <!-- Player control -->
          <div v-else class="flex gap-2 mt-2">
            <UButton @click="joinBingoGame(game.id)" size="sm" color="primary">
              Join
            </UButton>
          </div>
        </div>
      </div>
      <section v-if="profile?.role === 'admin'">
        <h2 class="text-xl font-bold mb-2">Recent Bingo Winners</h2>

        <div v-if="recentResultsLoading" class="text-gray-400">
          Loading results...
        </div>
        <div v-else-if="!recentResults.length" class="text-gray-400">
          No results yet.
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="res in recentResults"
            :key="res.id"
            class="p-2 bg-gray-800 rounded text-sm flex justify-between"
          >
            <span>{{ res.username || res.contestant_id }}</span>
            <span class="text-green-400">{{ res.payout }} 💎</span>
            <span class="text-gray-400">{{
              new Date(res.created_at).toLocaleString()
            }}</span>
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>
