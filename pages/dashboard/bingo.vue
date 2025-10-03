<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BaseModal from "~/components/BaseModal.vue";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAutoDraw } from "~/composables/useAutoDraw";

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
// const {
//   games: triviaGames,
//   visibleGames: visibleTriviaGames,
//   loading: triviaLoading,
//   creating: triviaCreating,
//   message: triviaMessage,
//   createGame: createTriviaGame,
//   startGame: startTriviaGame,
//   joinGame: joinTriviaGame,
// } = useTrivia();

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

const currentGame = ref<DashboardGameState>({
  game: null,
  draws: [],
  candidates: [],
  contestants: [],
  loading: false,
});

//@ts-ignore
const game_id = computed(() => currentGame.value?.game.id);
const {
  start,
  stop: stopAutoDraw,
  isRunning,
} = useAutoDraw({
  gameId: game_id,
  drawFn: onDraw,
  getDraws: () => currentGame.value.draws,
});

const isLobby = computed(() => currentGame.value.game?.status === "lobby");
const isActive = computed(() => currentGame.value.game?.status === "active");
const isEnded = computed(() => currentGame.value.game?.status === "ended");

const handleCreateBingoGame = async () => {
  if (!currentGame.value) {
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
  } finally {
    bingoLoading.value = false;
  }
}; // For issuing join codes
const newContestant = reactive({
  username: "",
  numCards: 1,
  freeSpace: true,
  autoMark: true,
});

const loggedInContestant = reactive({
  username: profile.value?.username,
  numCards: 1,
  freeSpace: true,
  autoMark: true,
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
    const { code, contestant } = (await issueJoinCode(
      gameId,
      newContestant.username,
      newContestant.numCards,
      newContestant.freeSpace,
      newContestant.autoMark
    )) as IssueJoinCodeResponse;

    lastIssuedCode.value = code;
    lastContestantUsername.value = newContestant.username;

    currentGame.value.contestants = (await getContestants(
      gameId
    )) as ContestantType[];

    // reset form
    newContestant.username = "";
    newContestant.numCards = 1;
    newContestant.freeSpace = true;
    newContestant.autoMark = true;

    // add newly added constant data to the current contestant list
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

  // const contestants = stateMap.value?.[gameId]?.contestants;
  // if (!contestants || !Array.isArray(contestants)) return null;

  if (playerExistsInGame) {
    return playerExistsInGame.code;
  }
};

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
        stopAutoDraw();
        // if thstopAutoDrawe new result has a winner name then we open the modal
        if (confirmed.username && confirmed.contestant_id && isAdmin) {
          open(
            confirmed.username ?? confirmed.contestant_id,
            confirmed.contestant_id ?? confirmed.contestant_id,
            confirmed.payout ?? confirmed.payout
          );
        }
        // refresh gamestate here ?
        // refreshBingo();
        stopAutoDraw();
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
  setupLobbyChannel(game.id);
});

onBeforeUnmount(() => {
  unsubscribeAll();
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
          freeSpace: loggedInContestant.freeSpace,
          autoMark: loggedInContestant.autoMark,
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

async function onDraw(gameId: string) {
  // try to apply the minimal change first
  const res = await drawNumber(gameId); // => { draw } | undefined
  if (res?.draw && !currentGame.value.draws.includes(res.draw.number)) {
    currentGame.value.draws.push(res.draw.number);
  } else {
    // fallback: full refresh
    // await refreshCurrentGame(gameId);
  }
}

const onStop = async (gameId: string) => {
  stopAutoDraw();
  const res = await stopGame(gameId); // => { game } | undefined
  const data = await $fetch<any>("/api/bingo/results/recent");

  recentResults.value = data;
  if (res?.game) {
    currentGame.value.game = res.game; // status should be 'ended' now
  } else {
    await refreshCurrentGame(gameId);
  }
};

const handleReloadGame = async () => {
  currentGame.value.game = null;
  currentGame.value.draws = [];
  currentGame.value.candidates = [];
  currentGame.value.contestants = [];
  currentGame.value.loading = false;
  const game = await loadBingoGame();
  if (!game) return;

  currentGame.value.game = game;
  await hydrateGameState(game.id);
  const data = await $fetch<any>("/api/bingo/results/recent");

  recentResults.value = data;
};

const handleRemoveContestant = async (contestantId: string): Promise<void> => {
  console.log("calling handle Remove contestant");
  if (!isLobby.value) {
    console.log("Game already started, cannot remove contestant.");
    return;
  }

  if (!currentGame.value.game?.id) {
    console.log("No current game id?");
    return;
  }
  console.log("deleting cards");
  try {
    // Delete cards first
    await supabase
      .from("bingo_cards")
      .delete()
      .eq("contestant_id", contestantId)
      .eq("game_id", currentGame.value.game?.id);
    console.log("cards deleted. now deleting from contestant list");
    // Delete contestant
    await supabase
      .from("bingo_contestants")
      .delete()
      .eq("id", contestantId)
      .eq("game_id", currentGame.value.game?.id);
    console.log("contestant deleted. now refetching contestant list");

    // Refetch contestants list
    const updatedContestants = await getContestants(currentGame.value.game?.id);
    console.log("updated contestants", updatedContestants);
    if (!updatedContestants) return;
    currentGame.value.contestants = updatedContestants;

    console.log("Contestant removed:", contestantId);
  } catch (err) {
    console.error("Error removing contestant:", err);
  }
};

watch(
  () => currentGame.value?.game?.status,
  (newStatus, oldStatus) => {
    if (newStatus === "ended" && oldStatus !== "ended") {
      console.log("[autoDraw] Game ended → stopping auto draw");
      stopAutoDraw();
    }
  }
);

type PricingPreset = {
  id: string;
  label: string;
  baseCardCost: number;
  freeSpaceCost: number;
  autoMarkCost: number;
  payout?: number;
  payoutPercentage?: number;
};

const pricingPresets: PricingPreset[] = [
  {
    id: "rose",
    label: "Rose Bingo · 80 base / 0 free / 0 auto (50% pot)",
    baseCardCost: 80,
    freeSpaceCost: 0,
    autoMarkCost: 0,
    payoutPercentage: 0.5,
  },
  {
    id: "standard",
    label: "Standard · 400 base / 100 free / 0 auto (💎1000)",
    baseCardCost: 400,
    freeSpaceCost: 100,
    autoMarkCost: 0,
    payout: 1000,
  },
  {
    id: "premium",
    label: "Premium · 500 base / 125 free / 50 auto (💎1500)",
    baseCardCost: 500,
    freeSpaceCost: 125,
    autoMarkCost: 50,
    payout: 1500,
  },
  {
    id: "highRoller",
    label: "High Roller · 600 base / 150 free / 100 auto (💎2000)",
    baseCardCost: 600,
    freeSpaceCost: 150,
    autoMarkCost: 100,
    payout: 2000,
  },
];

const defaultPricingPreset =
  pricingPresets.find((preset) => preset.id === "standard") ??
  pricingPresets[0] ??
  null;

const baseCardCost = ref(defaultPricingPreset?.baseCardCost ?? 400); // default in diamonds / points / $
const freeSpaceCost = ref(defaultPricingPreset?.freeSpaceCost ?? 100);
const autoMarkCost = ref(defaultPricingPreset?.autoMarkCost ?? 0);
const selectedPricingPresetId = ref<string | undefined>(
  defaultPricingPreset?.id ?? pricingPresets[0]?.id ?? undefined
);

const pricingPresetItems = computed(() =>
  pricingPresets.map((preset) => ({
    label: preset.label,
    value: preset.id,
  }))
);

const totalContestantCards = computed(() =>
  currentGame.value.contestants.reduce(
    (total, contestant) => total + (contestant.num_cards ?? 0),
    0
  )
);

const computePresetPayout = (preset: PricingPreset | undefined) => {
  if (!preset) return null;

  if (typeof preset.payoutPercentage === "number") {
    const totalCards = totalContestantCards.value;
    if (totalCards <= 0) {
      return 0;
    }
    const totalCardCost = totalCards * preset.baseCardCost;
    return Math.round(totalCardCost * preset.payoutPercentage);
  }

  if (typeof preset.payout === "number") {
    return preset.payout;
  }

  return null;
};

const isApplyingPricingPreset = ref(false);

const applyPricingPreset = (preset: PricingPreset | undefined) => {
  if (!preset) return;
  isApplyingPricingPreset.value = true;
  baseCardCost.value = preset.baseCardCost;
  freeSpaceCost.value = preset.freeSpaceCost;
  autoMarkCost.value = preset.autoMarkCost;

  if (currentGame.value.game) {
    const payoutValue = computePresetPayout(preset);
    if (typeof payoutValue === "number") {
      currentGame.value.game.payout = payoutValue;
    }
  }
  nextTick(() => {
    isApplyingPricingPreset.value = false;
  });
};

watch(
  selectedPricingPresetId,
  (id) => {
    if (!id) return;
    const preset = pricingPresets.find((item) => item.id === id);
    applyPricingPreset(preset);
  },
  { immediate: true }
);

const clearPresetIfCustom = () => {
  if (isApplyingPricingPreset.value) return;
  if (!selectedPricingPresetId.value) return;
  const preset = pricingPresets.find(
    (item) => item.id === selectedPricingPresetId.value
  );
  if (!preset) return;

  const payout = currentGame.value.game?.payout;
  const expectedPayout = computePresetPayout(preset);
  let payoutNumber = 0;
  if (typeof payout === "number") {
    payoutNumber = payout;
  } else if (typeof payout === "string") {
    const parsed = Number(payout);
    payoutNumber = Number.isNaN(parsed) ? 0 : parsed;
  }
  const payoutMatches =
    expectedPayout === null ? true : payoutNumber === expectedPayout;

  if (
    baseCardCost.value !== preset.baseCardCost ||
    freeSpaceCost.value !== preset.freeSpaceCost ||
    autoMarkCost.value !== preset.autoMarkCost ||
    (currentGame.value.game && !payoutMatches)
  ) {
    selectedPricingPresetId.value = undefined;
  }
};

watch([baseCardCost, freeSpaceCost, autoMarkCost], clearPresetIfCustom);
watch(
  () => currentGame.value.game?.payout,
  () => {
    clearPresetIfCustom();
  }
);

watch(
  [totalContestantCards, () => currentGame.value.game?.status],
  () => {
    if (!selectedPricingPresetId.value) return;
    const preset = pricingPresets.find(
      (item) => item.id === selectedPricingPresetId.value
    );
    if (!preset) return;
    if (typeof preset.payoutPercentage !== "number") return;
    if (!currentGame.value.game || currentGame.value.game.status !== "lobby") return;

    const payoutValue = computePresetPayout(preset);
    if (typeof payoutValue !== "number") return;

    isApplyingPricingPreset.value = true;
    currentGame.value.game.payout = payoutValue;
    nextTick(() => {
      isApplyingPricingPreset.value = false;
    });
  },
  { immediate: true }
);

// computed → dynamic cost per card

const calculateCost = (
  numCards: number,
  freeSpace: boolean,
  autoMark: boolean
) => {
  // should take a number of cards from new contestant or logged in user

  let solution = numCards * baseCardCost.value;
  if (freeSpace) {
    solution = solution + freeSpaceCost.value;
  }
  if (autoMark) {
    solution = solution + autoMarkCost.value;
  }

  return solution;
};

const handleStartBingoGame = async (
  gameId: string,
  payout: number | undefined | string
) => {
  await startBingoGame(gameId, payout);
  const updatedState = await getState(gameId);
  if (!updatedState.game) {
    bingoMessage.value = "Error Loading game after Starting Bingo";
    return;
  }
  currentGame.value = {
    ...updatedState,
    game: updatedState.game ?? undefined,
    loading: false,
  };
};

const players = ref<any[]>([]);
const allReady = ref(false);
let channel: RealtimeChannel | null = null;

const setupLobbyChannel = (gameId: string) => {
  if (channel) {
    channel.unsubscribe();
    channel = null;
  }

  channel = supabase.channel(`lobby:${gameId}`, { config: { presence: {} } });

  // keep last presence snapshot
  let prev = new Map<string, { username: string; ready: boolean }>();

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel!.presenceState();
      // flatten and build current map
      const curr = new Map<string, { username: string; ready: boolean }>();
      //@ts-ignore
      const flat = Object.values(state).flat() as Array<{
        user_id: string;
        username: string;
        ready: boolean;
      }>;
      flat.forEach((p) =>
        curr.set(p.user_id, { username: p.username, ready: !!p.ready })
      );

      // joins + toggles
      for (const [id, now] of curr) {
        const before = prev.get(id);
        if (!before) {
          console.log(`[JOIN] ${now.username} ready=${now.ready}`);
        } else if (before.ready !== now.ready) {
          console.log(
            `[TOGGLE] ${now.username} ${before.ready} -> ${now.ready}`
          );
        }
      }

      // real leaves
      for (const [id, before] of prev) {
        if (!curr.has(id)) {
          console.log(`[LEAVE] ${before.username} left`);
        }
      }

      // update your UI state
      players.value = flat;
      allReady.value =
        players.value.length > 0 &&
        players.value.every((p) => p.ready === true);

      // save snapshot
      prev = curr;
    })
    .subscribe();
};

const getReadyIds = () => {
  const readyPlayers = players.value
    .filter((p) => p.ready === true)
    .map((p) => String(p.user_id));
  return readyPlayers;
};

console.log("all ready", allReady);
</script>

<template>
  <main class="p-2 space-y-8">
    <!-- Trivia Games Section -->
    <!-- <section>
      <h1 class="text-2xl font-bold mb-2">Trivia Games</h1>

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

      <div v-if="triviaLoading">Loading games...</div>

      <div v-else-if="visibleTriviaGames.length === 0" class="text-gray-400">
        <span v-if="isAdmin">
          No trivia games created yet. Create one to get started!
        </span>
        <span v-else> No live trivia games available right now. </span>
      </div>

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
    </section> -->

    <!-- Bingo Games Section -->
    <section>
      <h1 class="text-2xl font-bold mb-2">Bingo Games</h1>

      <!-- Admin-only: Create Bingo Game -->
      <div v-if="isAdmin" class="bg-gray-800 p-4 rounded space-y-3">
        <UButton
          :loading="bingoCreating"
          color="primary"
          class="w-full"
          @click="handleCreateBingoGame()"
        >
          Create Game
        </UButton>
        <div>
          <label class="block text-gray-300 text-sm mb-1">Pricing Preset</label>
          <USelect
            v-model="selectedPricingPresetId"
            :items="pricingPresetItems"
            placeholder="Select a preset"
            class="w-full"
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-gray-300 text-sm mb-1"
              >Base Card Cost</label
            >
            <UInput
              v-model="baseCardCost"
              type="number"
              min="0"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-gray-300 text-sm mb-1"
              >Free Space Cost</label
            >
            <UInput
              v-model="freeSpaceCost"
              type="number"
              min="0"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-gray-300 text-sm mb-1"
              >Auto Mark Cost</label
            >
            <UInput
              v-model="autoMarkCost"
              type="number"
              min="0"
              class="w-full"
            />
          </div>
        </div>
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
            <div class="w-full">
              <div class="flex w-full items-center justify-between">
                <p class="font-semibold">Current Game</p>

                <p v-if="isActive" class="text-sm text-gray-400">
                  💎 {{ currentGame.game.payout }}
                </p>
              </div>
              <div class="flex w-full items-center justify-between">
                <p class="text-sm text-gray-400">
                  Status: {{ currentGame.game.status }}
                </p>

                <USwitch
                  v-if="isActive"
                  v-model="isRunning"
                  label="Auto Draw"
                  @update:model-value="
                    (val: boolean) => (val ? start() : stopAutoDraw())
                  "
                />
              </div>
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
                v-if="isLobby && currentGame.contestants.length > 1"
                size="sm"
                color="primary"
                :class="
                  allReady
                    ? 'ring-4 ring-green-500 animate-pulse shadow-lg shadow-green-500/30'
                    : ''
                "
                @click="
                  handleStartBingoGame(
                    currentGame.game.id,
                    currentGame.game.payout || 0
                  )
                "
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
              Expected Cost - Working:
              {{
                calculateCost(
                  newContestant.numCards || 0,
                  newContestant.freeSpace || false,
                  newContestant.autoMark
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
            :game-status="currentGame.game.status"
            :game-id="game_id"
            :draws="currentGame.draws"
            :contestants="currentGame.contestants"
            :loading="currentGame.loading"
            :auto-draw-running="isRunning"
            :ready-ids="getReadyIds()"
            @draw="onDraw"
            @reload-game="handleReloadGame"
            @stop="onStop(game_id)"
            @remove-contestant="handleRemoveContestant"
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
                    loggedInContestant.freeSpace,
                    loggedInContestant.autoMark
                  )
                }}
                diamonds
              </p>

              <UButton
                size="sm"
                color="primary"
                @click="handleSelfJoinCurrentGame()"
              >
                Join
              </UButton>
              <UInput
                v-model.number="loggedInContestant.numCards"
                :disabled="!!loggedInContestant.code"
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
                  v-model="loggedInContestant.freeSpace"
                  :disabled="!!loggedInContestant.code"
                  type="checkbox"
                />
                <span>Free Space</span>
              </label>
              <label class="flex items-center text-xs text-gray-300 space-x-1">
                <input
                  v-model="loggedInContestant.autoMark"
                  :disabled="!!loggedInContestant.code"
                  type="checkbox"
                />
                <span>Auto Mark</span>
              </label>
            </div>
            <div v-if="findGameCode(currentGame.game.id)" class="flex">
              Bingo Code: {{ findGameCode(profile?.id) }}
            </div>
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
      <BingoAdminTool v-if="isAdmin" />
    </section>
  </main>
</template>
