<script setup lang="ts">
import type { Database } from "~/types/supabase";
import { calculateCost } from "~/utils/bingo/pricing";
import BaseModal from "~/components/BaseModal.vue";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  BaseGameRow,
  BingoCard,
  BingoGameRow,
  BingoResultRow,
  ClientGameState,
  ContestantType,
  DashboardGameState,
  IssueJoinCodeResponse,
  JoinGameResponse,
  UseBingo,
} from "~/types/bingo";

const supabase = useSupabaseClient<Database>();
const { profile, isAdmin } = useProfile();
const router = useRouter();

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

const {
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
  loadGame: loadBingoGame,
  narrowGame,
} = useBingo() as UseBingo;

// const stateMap = ref<Record<string, DashboardGameState>>({});
const currentGame = ref<DashboardGameState>({
  game: null,
  draws: [],
  candidates: [],
  contestants: [],
  loading: false,
});

const currentCandidates = computed(() => currentGame.value.candidates);

console.log("currentCandidates:", currentCandidates);

const isLobby = computed(() => currentGame.value.game?.status === "lobby");
const isActive = computed(() => currentGame.value.game?.status === "active");
const isEnded = computed(() => currentGame.value.game?.status === "ended");

const handleCreateBingoGame = async () => {
  if (!currentGame.value) {
    console.log("current game", currentGame.value);
    bingoMessage.value = "Bingo Game Exists";
    return;
  }
  bingoLoading.value = true;

  try {
    const gameInitialized = await createBingoGame();
    if (gameInitialized) {
      currentGame.value.game = gameInitialized;
    }
  } catch (e: any) {
    bingoMessage.value = e.message;
  }
}; // For issuing join codes
const newContestant = reactive({
  username: "",
  numCards: 1,
  freeSpace: false,
  autoMark: false,
});

const loggedInContestant = reactive({
  username: profile.value?.username,
  numCards: 1,
  freeSpace: false,
  autoMark: false,
  code: "",
});
type RTESubs = {
  channel: RealtimeChannel;
  id: string;
};
const lastIssuedCode = ref<string | null>(null);
const lastContestantUsername = ref<string | null>(null);
const gameEnded = ref(false);
const overlay = useOverlay();
const subscriptions: RTESubs[] = [];
const channels: Record<string, RealtimeChannel> = {};

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
    const { code } = (await issueJoinCode(
      gameId,
      newContestant.username,
      newContestant.numCards,
      newContestant.freeSpace,
      newContestant.autoMark
    )) as IssueJoinCodeResponse;

    lastIssuedCode.value = code;
    lastContestantUsername.value = newContestant.username;

    // reset form
    newContestant.username = "";
    newContestant.numCards = 1;
    newContestant.freeSpace = false;
    newContestant.autoMark = false;
  } catch (err) {
    console.error("Error issuing join code:", err);
  }
};

// to find the gamecode we need to check the current player id
// and see if it exist within the current game list of contestants
const findGameCode = (
  profileId: Profile["id"] | undefined
): string | undefined => {
  if (!profileId) return;

  console.log("profile Id", profileId);
  const playerExistsInGame = currentGame.value.contestants.find(
    (contestant) => contestant.user_id === profile.value?.id
  );
  console.log("player that exists", playerExistsInGame);
  console.log("candidates", currentGame.value.candidates);

  // const contestants = stateMap.value?.[gameId]?.contestants;
  // if (!contestants || !Array.isArray(contestants)) return null;

  if (playerExistsInGame) {
    return playerExistsInGame.code;
  }
};
watch(
  () => currentGame.value.candidates,
  (arr) =>
    console.log(
      "[candidates]",
      arr.map((c) => c.id)
    ),
  { deep: true, immediate: true }
);
const mySelectedContestantCard = ref<ContestantType | null>(null);

const hydrateMyPrefsFromGame = async () => {
  // only for logged-in, non-admin users in a game context
  if (!profile.value?.id || isAdmin.value) return;
  const gameId = currentGame.value.game?.id;
  if (!gameId) return;

  // find this user’s contestant row in this game (by user_id)
  // const mineCandidate =
  //   currentGame.value.candidates.find(
  //     (c) => c.contestant_id === profile.value!.id
  //   ) ?? null;
  const mineContestant =
    currentGame.value.contestants.find(
      (c) => c.user_id === profile.value!.id
    ) ?? null;

  // mySelectedCandidateCard.value = mineCandidate;
  mySelectedContestantCard.value = mineContestant;
  if (!mineContestant) return;

  // use their current num cards (for estimated cost)
  loggedInContestant.numCards = mineContestant.num_cards ?? 1;
  // loggedInContestant.autoMark = mineCandidate.auto_mark_enabled;
  // loggedInContestant.freeSpace = mineCandidate.free_space;

  // 3) fetch ONE card to read prefs (don't trust currentGame.candidates for this)
  const { data: rows, error } = await supabase
    .from("bingo_cards")
    .select("*")
    .eq("contestant_id", mineContestant.id)
    .limit(1);

  if (error) {
    console.error("[hydrateMyPrefsFromGame] card fetch error:", error.message);
    return;
  }

  const card = rows?.[0] as unknown as BingoCard | undefined;
  if (card) {
    loggedInContestant.autoMark = !!card.auto_mark_enabled;
    loggedInContestant.freeSpace = !!card.free_space;
    // (optional) keep their join code around
    loggedInContestant.code = mineContestant.code;
  }
};
const lastHydratedGameId = ref<string | null>(null);

watch(
  () => ({
    gid: currentGame.value.game?.id ?? null,
    contestantsLen: currentGame.value.contestants.length,
    uid: profile.value?.id ?? null,
    role: profile.value?.role ?? null,
  }),
  async ({ gid }) => {
    if (!gid) return;
    if (lastHydratedGameId.value === gid) {
      // contestants might have loaded later — still hydrate
      await hydrateMyPrefsFromGame();
      return;
    }
    lastHydratedGameId.value = gid;
    await hydrateMyPrefsFromGame();
  },
  { immediate: true, deep: false }
);

const handleJoin = async (gameId: BingoGameRow["id"]) => {
  const bingoGameCode = findGameCode(gameId);

  if (bingoGameCode) {
    router.push(`/play/bingo/${bingoGameCode}`);
    return;
  }

  console.log("creating new candidate");
  try {
    const codeData = await issueJoinCode(
      gameId,
      loggedInContestant.username ?? "",
      loggedInContestant.numCards,
      loggedInContestant.freeSpace,
      true
    );

    //@ts-ignore
    const { code } = codeData;

    const data = (await joinBingoGame(code)) as IssueJoinCodeResponse;
    if (!data) {
      bingoMessage.value = `Error joining Bingo with code: ${code}`;
    }
    console.log(data.contestant, data.cards);
    router.push(`/play/bingo/${code}`);

    // reset form
    loggedInContestant.username = "";
    loggedInContestant.numCards = 1;
    loggedInContestant.freeSpace = false;
    loggedInContestant.autoMark = false;
    console.log(code, loggedInContestant);
  } catch (e: any) {
    console.error(e);
  }
};

const subscribeToContestants = (gameId: BingoGameRow["id"]) => {
  if (channels.contestants) return;
  channels.contestants = supabase
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
        const c = payload.new as ContestantType;
        currentGame.value.contestants = [...currentGame.value.contestants, c];
      }
    )
    .subscribe();

  console.log("Subscribed to Contestants");
};

const subscribeToResults = (gameId: BingoGameRow["id"]) => {
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
        const confirmed = payload?.new as BingoResultRow;

        // if the new result has a winner name then we open the modal
        if (confirmed.username && confirmed.contestant_id) {
          open(
            confirmed.username ?? confirmed.contestant_id,
            confirmed.contestant_id ?? confirmed.contestant_id,
            confirmed.payout ?? confirmed.payout
          );
        }
        // refresh gamestate here ?
      }
    )
    .subscribe();
  console.log("Subscribed to Results");
};

const subscribeToGame = (gameId: BingoGameRow["id"]) => {
  if (channels.game) return;
  channels.game = supabase
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
        // keep app-level status union
        currentGame.value.game = narrowGame(updated);
      }
    )
    .subscribe();
  console.log("Subscribed to Game");
};

const subscribeToDraws = (gameId: BingoGameRow["id"]) => {
  if (channels.draws) return;
  channels.draws = supabase
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
        const row =
          payload.new as Database["public"]["Tables"]["bingo_draws"]["Row"];
        if (!currentGame.value.draws.includes(row.number)) {
          currentGame.value.draws.push(row.number); // mutate to preserve reactivity
        }
      }
    )
    .subscribe();
  console.log("Subscribed to Draws");
};

const unsubscribeAll = () => {
  Object.values(channels).forEach((ch) => supabase.removeChannel(ch));
  for (const k of Object.keys(channels)) delete channels[k];
};

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

// on mounted lets fetch the first active or lobby game

onMounted(async () => {
  // fetch the latest non-ended game
  const game = await loadBingoGame();
  if (!game) return;

  currentGame.value.game = game;
  await hydrateGameState(game.id);

  // subscribe after initial hydration
  subscribeToGame(game.id);
  subscribeToDraws(game.id);
  subscribeToContestants(game.id);
  subscribeToResults(game.id);
});

onBeforeUnmount(() => {
  unsubscribeAll();
});

onBeforeUnmount(() => {
  subscriptions.forEach((sub) => {
    supabase.removeChannel(sub.channel);
  });
  subscriptions.length = 0; // clear refs
});

async function hydrateGameState(gameId: string) {
  currentGame.value.loading = true;
  try {
    const state = await getState(gameId); // ClientGameState: draws:number[], winners, candidates, contestants
    if (!state.game) return;
    currentGame.value.game = state.game;

    // mutate arrays to preserve identity
    currentGame.value.draws.splice(
      0,
      currentGame.value.draws.length,
      ...state.draws
    );
    currentGame.value.candidates.splice(
      0,
      currentGame.value.candidates.length,
      ...state.candidates
    );
    currentGame.value.contestants.splice(
      0,
      currentGame.value.contestants.length,
      ...state.contestants
    );
  } finally {
    currentGame.value.loading = false;
  }
}

const refreshCurrentGame = async (gameId: string) => {
  currentGame.value.loading = true;
  try {
    const next = await getState(gameId); // ClientGameState (draws:number[])

    if (!next.game) {
      return;
    }
    currentGame.value.game = next.game;

    // keep array identity (reactivity-safe)
    currentGame.value.draws.splice(
      0,
      currentGame.value.draws.length,
      ...next.draws
    );
    currentGame.value.candidates.splice(
      0,
      currentGame.value.candidates.length,
      ...next.candidates
    );
    currentGame.value.contestants.splice(
      0,
      currentGame.value.contestants.length,
      ...next.contestants
    );
  } finally {
    currentGame.value.loading = false;
  }
};

// Types you already have:
// type BingoGameRow, type ContestantType, type IssueJoinCodeResponse, etc.

const handleSelfJoinCurrentGame = async () => {
  const gameId = currentGame.value.game?.id;
  const profileId = profile.value?.id; // Supabase auth user id
  if (!gameId || !profileId) return;

  // 1) Already a contestant? Navigate using their existing code.
  const existingCode = findGameCode(profileId);
  if (existingCode) {
    console.log("code exists");
    router.push(`/play/bingo/${existingCode}`);
    return;
  }

  // 2) Not a contestant yet → create one (with user_id) and navigate.
  try {
    // Call a dedicated endpoint that:
    //  - upserts/creates a contestant with { game_id, user_id, username, ... }
    //  - generates a join code
    //  - returns { contestant, code, cards }
    const res = await $fetch<IssueJoinCodeResponse>(
      `/api/bingo/games/${gameId}/join-as-user`,
      {
        method: "POST",
        body: {
          // sensible defaults; tweak to your UI
          username: profile.value?.username || profile.value?.email || "Player",
          numCards: loggedInContestant.numCards ?? 1,
          freeSpace: !!loggedInContestant.freeSpace,
          autoMark: true,
        },
      }
    );

    // update local state so UI reflects the new contestant immediately
    if (res?.contestant) {
      currentGame.value.contestants = [
        ...currentGame.value.contestants,
        res.contestant,
      ];
    }

    if (res?.code) {
      router.push(`/play/bingo/${res.code}`);
    } else {
      // Fallback if the API ever omits code
      const codeFromList = findGameCode(profileId);
      if (codeFromList) router.push(`/play/bingo/${codeFromList}`);
    }
  } catch (e) {
    console.error("Failed to self-join:", e);
  }
};

const onDraw = async (gameId: string) => {
  // try to apply the minimal change first
  const res = await drawNumber(gameId); // => { draw } | undefined
  if (res?.draw && !currentGame.value.draws.includes(res.draw.number)) {
    currentGame.value.draws.push(res.draw.number);
  } else {
    // fallback: full refresh
    await refreshCurrentGame(gameId);
  }
};

const onStop = async (gameId: string) => {
  const res = await stopGame(gameId); // => { game } | undefined
  if (res?.game) {
    currentGame.value.game = res.game; // status should be 'ended' now
  } else {
    await refreshCurrentGame(gameId);
  }
};

watch(
  () => currentGame.value.game?.status,
  (s) => console.log("[status]", s, "draws:", toRaw(currentGame.value.draws))
);
</script>

<template>
  <main class="p-2 space-y-8">
    <!-- Trivia Games Section -->
    <section>
      <h1 class="text-2xl font-bold mb-2">Trivia Games</h1>

      <!-- Admin-only: Create Trivia Game -->
      <div v-if="isAdmin" class="bg-gray-800 p-4 rounded space-y-3">
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
        <span v-if="isAdmin">
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
            <template v-if="isAdmin">
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
      <div v-if="isAdmin" class="bg-gray-800 p-4 rounded space-y-3">
        <UButton
          :loading="bingoCreating"
          @click="handleCreateBingoGame()"
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
      <div v-else-if="!currentGame.game" class="text-gray-400">
        <span v-if="isAdmin">
          No bingo games created yet. Create one to get started!
        </span>
        <span v-else> No live bingo games available right now. </span>
      </div>

      <!-- Games list -->
      <div v-else>
        <div :key="currentGame.game.id" class="p-2 my-2 bg-gray-800 rounded">
          <!-- Game header -->
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold">Bingo Game</p>
              <p class="text-sm text-gray-400">
                Status: {{ currentGame.game.status }}
              </p>
            </div>

            <!-- Inline: Start & payout input -->
            <div v-if="isAdmin" class="flex gap-2">
              <UInput
                v-if="isLobby"
                v-model.number="currentGame.game.payout"
                type="number"
                class="w-24 p-1 rounded bg-gray-900 border border-gray-600 text-white text-sm"
                placeholder="Payout"
              />

              <UButton
                v-if="isLobby"
                @click="
                  startBingoGame(
                    currentGame.game.id,
                    currentGame.game.payout || 0
                  )
                "
                size="sm"
                color="primary"
              >
                Start
              </UButton>
            </div>
          </div>

          <!-- Issue Join Code panel -->
          <div v-if="isAdmin && isLobby" class="mt-4 bg-gray-700 p-3 rounded">
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
              @click="handleIssueCode(currentGame.game.id)"
            >
              Generate Code
            </UButton>

            <p v-if="lastIssuedCode" class="text-xs text-green-400 mt-2">
              Code issued: {{ lastIssuedCode }} for {{ lastContestantUsername }}
            </p>
          </div>

          <!-- Admin control panel -->

          <!-- in this, do the actions do something to state that is bad? things
          things arent being updated  -->
          <BingoGameControl
            v-if="isAdmin && currentGame.game"
            :game="currentGame.game"
            :draws="currentGame.draws"
            :contestants="currentGame.contestants"
            :loading="currentGame.loading"
            @draw="onDraw"
            @stop="onStop"
          />

          <!-- Player control -->
          <div v-else class="flex flex-col gap-2 mt-2">
            <div class="flex justify-between">
              <!-- FIX THIS -->

              <p class="text-xs text-gray-400 mt-2">
                Expected Cost:
                {{
                  calculateCost(
                    loggedInContestant.numCards || 0,
                    loggedInContestant.freeSpace || false
                  )
                }}
                diamonds
              </p>

              <UButton
                @click="handleSelfJoinCurrentGame()"
                size="sm"
                color="primary"
              >
                Join
              </UButton>
              <UInput
                :disabled="!!loggedInContestant.code"
                v-model.number="loggedInContestant.numCards"
                type="number"
                min="1"
                placeholder="Cards"
                size="sm"
                class="text-white"
              />
            </div>
            <div class="flex gap-2 justify-start">
              <label class="flex items-center text-xs text-gray-300 space-x-1">
                <input
                  :disabled="!!loggedInContestant.code"
                  v-model="loggedInContestant.freeSpace"
                  type="checkbox"
                />
                <span>Free Space</span>
              </label>
              <label class="flex items-center text-xs text-gray-300 space-x-1">
                <input
                  :disabled="!!loggedInContestant.code"
                  v-model="loggedInContestant.autoMark"
                  type="checkbox"
                />
                <span>Auto Mark</span>
              </label>
              <p class="text-xs text-gray-400">
                Expected Cost:
                {{
                  calculateCost(
                    loggedInContestant.numCards || 0,
                    loggedInContestant.freeSpace || false
                  )
                }}
                diamonds
              </p>
            </div>
            <div v-if="findGameCode(currentGame.game.id)" class="flex">
              Bingo Code: {{ findGameCode(profile?.id) }}
            </div>

            <!-- <div class="flex">Bingo Code: {{ findGameCode(game.id) }}</div> -->
          </div>
        </div>
      </div>
      <section v-if="isAdmin">
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
<!-- :draws="stateMap[game.id]?.draws || []" -->
