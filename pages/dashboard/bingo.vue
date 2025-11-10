<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BaseModal from "~/components/BaseModal.vue";
import { useAutoDraw } from "~/composables/useAutoDraw";

import type {
  BingoCard,
  ContestantType,
  GameMode,
  IssueJoinCodeResponse,
  StrategyScoreHistoryRow,
  UseBingo,
} from "~/types/bingo";
import type {
  PricingPreset,
  PricingPresetDraft,
} from "~/composables/useBingoPricingPresets";

const supabase = useSupabaseClient<Database>();
const { profile, isAdmin } = useProfile();
const router = useRouter();
const { $toast } = useNuxtApp();
const currentGameModeDraft = ref<GameMode>("classic");
const gameModeOptions = [
  {
    label: "Classic · single winner",
    value: "classic",
  },
  {
    label: "Strategy · multi-round scoring",
    value: "strategy",
  },
];

const {
  loading: bingoLoading,
  creating: bingoCreating,
  message: bingoMessage,
  createGame: createBingoGame,
  startGame: startBingoGame,
  stopGame,
  drawNumber,
  issueJoinCode,
  getContestants,
  refresh: refreshBingo,
  recordStrategyScore,
  createDashboardController,
} = useBingo() as UseBingo;
const gameIdRef = computed(() => currentGame.game?.id ?? "");
const {
  start,
  stop: stopAutoDraw,
  isRunning,
} = useAutoDraw({
  gameId: gameIdRef,
  drawFn: onDraw,
  getDraws: () => currentGame.draws,
});

const isLobby = computed(() => currentGame.game?.status === "lobby");
const isActive = computed(() => currentGame.game?.status === "active");

const handleCreateBingoGame = async () => {
  bingoLoading.value = true;

  try {
    const gameInitialized = await createBingoGame();
    if (gameInitialized) {
      unsubscribeFromGameState();
      currentGame.game = gameInitialized;
      await hydrateGameState(gameInitialized.id);
      subscribeToGameState(gameInitialized.id);
      await fetchRecentResults();
    }
  } catch (e: any) {
    bingoMessage.value = e.message;
  } finally {
    bingoLoading.value = false;
  }
};
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
const lastIssuedCode = ref<string | null>(null);
const lastContestantUsername = ref<string | null>(null);
const overlay = useOverlay();

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

const {
  state: currentGame,
  players,
  allReady,
  recentResults,
  recentResultsLoading,
  recentResultsPage,
  recentResultsPageSize,
  recentResultsTotal,
  hydrate: hydrateGameState,
  refresh: refreshCurrentGame,
  loadLatestGame,
  fetchRecentResults,
  subscribe: subscribeToGameState,
  unsubscribe: unsubscribeFromGameState,
  removeContestant,
  findGameCode,
  totalContestantCards,
  strategyHistory,
  strategyLeaderboard,
  strategyScoresLoading,
  fetchStrategyScores,
  setStrategySource,
} = createDashboardController({
  onResult: (confirmed) => {
    if (confirmed.username && confirmed.contestant_id && isAdmin.value) {
      open(
        confirmed.username ?? confirmed.contestant_id,
        confirmed.contestant_id ?? confirmed.contestant_id,
        confirmed.payout ?? confirmed.payout
      );
    }
  },
  onStrategyScore: (score) => {
    if (isAdmin.value) {
      handleStrategyScoreToast(score);
    }
  },
});

const isStrategyMode = computed(
  () => currentGame.game?.mode === "strategy"
);
const showStrategyAdminPanel = computed(
  () => isAdmin.value && isStrategyMode.value
);

const recentResultsRangeText = computed(() => {
  if (!recentResultsTotal.value) return "";

  const start = (recentResultsPage.value - 1) * recentResultsPageSize.value + 1;
  const end = Math.min(
    recentResultsTotal.value,
    recentResultsPage.value * recentResultsPageSize.value
      );

  return `${start}-${end} of ${recentResultsTotal.value}`;
});

const strategyFilters = reactive({
  eventId: "",
  gameId: "",
  limit: 200,
});
const strategyForm = reactive({
  contestantId: "",
  pointsAwarded: 10,
  roundId: "",
  position: "",
  metadataNotes: "",
});
const strategyFormSubmitting = ref(false);
const strategyFormMessage = ref<string | null>(null);
const strategyFormMessageType = ref<"success" | "error" | null>(null);

const strategyContestantOptions = computed(() =>
  currentGame.contestants.map((contestant) => ({
    label: `${contestant.username} (${contestant.code})`,
    value: contestant.id,
  }))
);

const sortedStrategyLeaderboard = computed(() =>
  [...strategyLeaderboard.value].sort(
    (a, b) => b.totalPoints - a.totalPoints
  )
);
const strategyBadges = computed<
  Record<string, { rank: number; points: number }> | undefined
>(() => {
  if (!isStrategyMode.value) return undefined;
  const map: Record<string, { rank: number; points: number }> = {};
  sortedStrategyLeaderboard.value.forEach((entry, index) => {
    map[entry.contestantId] = {
      rank: index + 1,
      points: entry.totalPoints,
    };
  });
  return map;
});
const limitedStrategyHistory = computed(() =>
  strategyHistory.value.slice(0, 8)
);

const ensureStrategyEventForGame = async (gameId: string | null | undefined) => {
  if (!gameId || strategyFilters.eventId) return;
  try {
    const { data, error } = await supabase
      .from("bingo_events")
      .select("id")
      .eq("game_id", gameId)
      .maybeSingle();
    if (error) {
      console.error("Failed to find bingo event for game:", error.message);
      return;
    }
    if (data?.id) {
      strategyFilters.eventId = data.id;
    }
  } catch (err) {
    console.error("Failed to map game to event:", err);
  }
};

watch(
  () => currentGame.contestants.length,
  (len) => {
    if (!isStrategyMode.value) {
      strategyForm.contestantId = "";
      return;
    }
    if (len > 0 && !strategyForm.contestantId) {
      strategyForm.contestantId = currentGame.contestants[0].id;
    }
  },
  { immediate: true }
);

const handleApplyStrategySource = async () => {
  if (!isStrategyMode.value) {
    strategyFormMessage.value = "Switch the current game to Strategy mode first.";
    strategyFormMessageType.value = "error";
    return;
  }
  if (!strategyFilters.eventId && !strategyFilters.gameId) {
    strategyFormMessage.value =
      "Provide an event ID or game ID to load Strategy Bingo scores.";
    strategyFormMessageType.value = "error";
    return;
  }
  strategyFormMessage.value = null;
  strategyFormMessageType.value = null;

  await setStrategySource({
    eventId: strategyFilters.eventId || undefined,
    gameId: strategyFilters.gameId || undefined,
    limit: strategyFilters.limit,
  });
};

const handleClearStrategySource = async () => {
  strategyFilters.eventId = "";
  strategyFilters.gameId = "";
  await setStrategySource();
};

const handleRefreshStrategyScores = async () => {
  if (!isStrategyMode.value) return;
  if (!strategyFilters.eventId && !strategyFilters.gameId) return;
  await fetchStrategyScores({
    eventId: strategyFilters.eventId || undefined,
    gameId: strategyFilters.gameId || undefined,
    limit: strategyFilters.limit,
  });
};

const handleStrategyScoreToast = (score: StrategyScoreHistoryRow) => {
  if (!$toast) return;
  const contestant =
    currentGame.contestants.find((c) => c.id === score.contestant_id) ?? null;
  const metadata =
    typeof score.metadata === "object" && score.metadata
      ? (score.metadata as Record<string, any>)
      : {};
  const descriptor =
    typeof metadata.notes === "string"
      ? metadata.notes
      : score.round_id
      ? `Round ${score.round_id}`
      : "Strategy Bingo";

  $toast.success(`${contestant?.username ?? "Contestant"} +${score.points_awarded} pts`, {
    timeout: 2500,
    icon: "i-heroicons-sparkles-20-solid",
    description: descriptor,
  });
};

const handleRecordStrategyScore = async () => {
  strategyFormMessage.value = null;
  strategyFormMessageType.value = null;

  if (!isStrategyMode.value) {
    strategyFormMessage.value =
      "Switch the game to Strategy mode to record points.";
    strategyFormMessageType.value = "error";
    return;
  }
  if (!strategyFilters.eventId) {
    strategyFormMessage.value = "Event ID is required to record a score.";
    strategyFormMessageType.value = "error";
    return;
  }
  if (!strategyForm.contestantId) {
    strategyFormMessage.value = "Select a contestant to award points.";
    strategyFormMessageType.value = "error";
    return;
  }

  const parsedPoints = Number(strategyForm.pointsAwarded);
  if (!Number.isFinite(parsedPoints)) {
    strategyFormMessage.value = "Enter a numeric point value.";
    strategyFormMessageType.value = "error";
    return;
  }

  strategyFormSubmitting.value = true;
  try {
    await recordStrategyScore({
      eventId: strategyFilters.eventId,
      contestantId: strategyForm.contestantId,
      pointsAwarded: parsedPoints,
      gameId:
        strategyFilters.gameId || currentGame.game?.id || undefined,
      roundId: strategyForm.roundId || undefined,
      position: strategyForm.position
        ? Number(strategyForm.position)
        : undefined,
      metadata: strategyForm.metadataNotes
        ? { notes: strategyForm.metadataNotes }
        : {},
    });

    strategyFormMessage.value = "Score recorded.";
    strategyFormMessageType.value = "success";

    strategyForm.pointsAwarded = 0;
    strategyForm.roundId = "";
    strategyForm.position = "";
    strategyForm.metadataNotes = "";

    await handleRefreshStrategyScores();
  } catch (err: any) {
    strategyFormMessage.value =
      err?.statusMessage ||
      err?.message ||
      "Failed to record score.";
    strategyFormMessageType.value = "error";
  } finally {
    strategyFormSubmitting.value = false;
  }
};

const handleCurrentGameModeChange = async (mode: GameMode) => {
  if (!currentGame.game || currentGame.game.mode === mode) return;
  try {
    await $fetch(`/api/bingo/games/${currentGame.game.id}/mode`, {
      method: "PATCH",
      body: { mode },
    });
    currentGame.game.mode = mode;
    if (mode !== "strategy") {
      await handleClearStrategySource();
    } else {
      await ensureStrategyEventForGame(currentGame.game.id);
      await setStrategySource({
        eventId: strategyFilters.eventId || undefined,
        gameId: currentGame.game.id,
        limit: strategyFilters.limit,
      });
    }
  } catch (err: any) {
    $toast?.error(err?.statusMessage || err?.message || "Failed to update mode");
    currentGameModeDraft.value = currentGame.game.mode;
  }
};

watch(
  () => currentGame.game?.mode,
  (mode) => {
    if (!mode) {
      currentGameModeDraft.value = "classic";
      return;
    }
    currentGameModeDraft.value = mode;
  },
  { immediate: true }
);

watch(
  () => [currentGame.game?.id, currentGame.game?.mode] as const,
  async ([gameId, mode]) => {
    if (!isAdmin.value) return;
    if (!gameId || mode !== "strategy") {
      await handleClearStrategySource();
      return;
    }
    strategyFilters.gameId = gameId;
    if (!strategyFilters.eventId) {
      await ensureStrategyEventForGame(gameId);
    }
    await setStrategySource({
      eventId: strategyFilters.eventId || undefined,
      gameId: strategyFilters.gameId || undefined,
      limit: strategyFilters.limit,
    });
  },
  { immediate: true }
);

const strategyAutoRoundLabel = computed(() => {
  if (!isStrategyMode.value) return "";
  const drawCount = currentGame.draws.length;
  if (!drawCount) return "";
  const approxRound = Math.max(1, Math.ceil(drawCount / 5));
  return `Round ${approxRound}`;
});

watch(
  () => strategyAutoRoundLabel.value,
  (label) => {
    if (!isStrategyMode.value) return;
    if (!label) return;
    if (!strategyForm.roundId || strategyForm.roundId.startsWith("Round ")) {
      strategyForm.roundId = label;
    }
  },
  { immediate: true }
);
const handleRecentResultsPageChange = (page: number) => {
  if (recentResultsPage.value !== page) {
    recentResultsPage.value = page;
  }
  fetchRecentResults(page);
};

onMounted(async () => {
  await fetchRecentResults();
});

onMounted(async () => {
  const game = await loadLatestGame();
  if (!game) return;
  subscribeToGameState(game.id);
});

onBeforeUnmount(() => {
  unsubscribeFromGameState();
});
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

    currentGame.contestants = (await getContestants(
      gameId
    )) as ContestantType[];

    newContestant.username = "";
    newContestant.numCards = 1;
    newContestant.freeSpace = true;
    newContestant.autoMark = true;
  } catch (err) {
    console.error("Error issuing join code:", err);
  }
};

const mySelectedContestantCard = ref<ContestantType | null>(null);

const hydrateMyPrefsFromGame = async () => {
  if (!profile.value?.id || isAdmin.value) return;
  const gameId = currentGame.game?.id;
  if (!gameId) return;

  const mineContestant =
    currentGame.contestants.find(
      (c) => c.user_id === profile.value!.id
    ) ?? null;

  mySelectedContestantCard.value = mineContestant;
  if (!mineContestant) return;

  loggedInContestant.numCards = mineContestant.num_cards ?? 1;
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
    gid: currentGame.game?.id ?? null,
    contestantsLen: currentGame.contestants.length,
    uid: profile.value?.id ?? null,
    role: profile.value?.role ?? null,
  }),
  async ({ gid }) => {
    if (!gid) return;
    if (lastHydratedGameId.value === gid) {
      await hydrateMyPrefsFromGame();
      return;
    }
    lastHydratedGameId.value = gid;
    await hydrateMyPrefsFromGame();
  },
  { immediate: true, deep: false }
);


const handleSelfJoinCurrentGame = async () => {
  const gameId = currentGame.game?.id;
  const profileId = profile.value?.id; // Supabase auth user id
  if (!gameId || !profileId) return;

  const existingCode = findGameCode(profileId);
  if (existingCode) {
    router.push(`/play/bingo/${existingCode}`);
    return;
  }

  try {
    const res = await $fetch<IssueJoinCodeResponse>(
      `/api/bingo/games/${gameId}/join-as-user`,
      {
        method: "POST",
        body: {
          username: profile.value?.username || profile.value?.email || "Player",
          numCards: loggedInContestant.numCards ?? 1,
          freeSpace: loggedInContestant.freeSpace,
          autoMark: loggedInContestant.autoMark,
        },
      }
    );

    if (res?.contestant) {
      currentGame.contestants = [
        ...currentGame.contestants,
        res.contestant,
      ];
    }

    if (res?.code) {
      router.push(`/play/bingo/${res.code}`);
    } else {
      const codeFromList = findGameCode(profileId);
      if (codeFromList) router.push(`/play/bingo/${codeFromList}`);
    }
  } catch (e) {
    console.error("Failed to self-join:", e);
  }
};

async function onDraw(gameId: string) {
  const res = await drawNumber(gameId);
  if (res?.draw && !currentGame.draws.includes(res.draw.number)) {
    currentGame.draws.push(res.draw.number);
  }
}

const onStop = async (gameId: string | null) => {
  if (!gameId) return;
  stopAutoDraw();
  const res = await stopGame(gameId);
  await fetchRecentResults(1);
  if (res?.game) {
    currentGame.game = res.game;
  } else {
    await refreshCurrentGame(gameId);
  }
};

const handleReloadGame = async () => {
  unsubscribeFromGameState();
  currentGame.game = null;
  currentGame.draws = [];
  currentGame.candidates = [];
  currentGame.contestants = [];
  currentGame.loading = false;

  const game = await loadLatestGame();
  if (!game) return;

  subscribeToGameState(game.id);
  await fetchRecentResults();
};

const handleRemoveContestant = async (contestantId: string): Promise<void> => {
  if (!isLobby.value) return;
  await removeContestant(contestantId);
};

watch(
  () => currentGame.game?.status,
  (newStatus, oldStatus) => {
    if (newStatus === "ended" && oldStatus !== "ended") {
      stopAutoDraw();
    }
  }
);

const {
  pricingPresets,
  pricingPresetItems,
  selectedPricingPresetId,
  selectedPricingPreset,
  baseCardCost,
  freeSpaceCost,
  autoMarkCost,
  createPreset,
  removePreset,
  findPresetById,
  roundPayoutToNearestTen,
} = useBingoPricingPresets();

const computePresetPayout = (preset: PricingPreset | undefined) => {
  if (!preset) return null;

  if (typeof preset.payoutPercentage === "number") {
    const totalCards = totalContestantCards.value;
    if (totalCards <= 0) {
      return 0;
    }
    const totalCardCost = totalCards * preset.baseCardCost;
    return roundPayoutToNearestTen(totalCardCost, preset.payoutPercentage);
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

  if (currentGame.game) {
    const payoutValue = computePresetPayout(preset);
    if (typeof payoutValue === "number") {
      currentGame.game.payout = payoutValue;
    }
  }
  nextTick(() => {
    isApplyingPricingPreset.value = false;
  });
};

watch(
  selectedPricingPresetId,
  (id) => {
    const preset = id ? findPresetById(id) : undefined;
    if (id && !preset) {
      const fallback = findPresetById("rose") ?? pricingPresets.value[0] ?? null;
      selectedPricingPresetId.value = fallback?.id ?? undefined;
      return;
    }
    if (preset) {
      applyPricingPreset(preset);
    }
  },
  { immediate: true }
);

const clearPresetIfCustom = () => {
  if (isApplyingPricingPreset.value) return;
  if (!selectedPricingPresetId.value) return;
  const preset = findPresetById(selectedPricingPresetId.value);
  if (!preset) return;

  const payout = currentGame.game?.payout;
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
    (currentGame.game && !payoutMatches)
  ) {
    selectedPricingPresetId.value = undefined;
  }
};

watch([baseCardCost, freeSpaceCost, autoMarkCost], () => {
  clearPresetIfCustom();
});

watch(
  () => currentGame.game?.payout,
  () => {
    clearPresetIfCustom();
  }
);

watch(
  [totalContestantCards, () => currentGame.game?.status],
  () => {
    if (!selectedPricingPresetId.value) return;
    const preset = findPresetById(selectedPricingPresetId.value);
    if (!preset) return;
    if (typeof preset.payoutPercentage !== "number") return;
    if (!currentGame.game || currentGame.game.status !== "lobby")
      return;

    const payoutValue = computePresetPayout(preset);
    if (typeof payoutValue !== "number") return;

    isApplyingPricingPreset.value = true;
    currentGame.game.payout = payoutValue;
    nextTick(() => {
      isApplyingPricingPreset.value = false;
    });
  },
  { immediate: true }
);

const handleCreatePricingPreset = (draft: PricingPresetDraft) => {
  createPreset(draft);
};

const handleDeletePricingPreset = (id: string) => {
  const preset = findPresetById(id);
  if (!preset) return;
  if (preset.metadata?.source === "builtin") return;

  if (typeof window !== "undefined") {
    const confirmed = window.confirm(
      `Delete the "${preset.name}" pricing preset?`
    );
    if (!confirmed) return;
  }

  removePreset(id);
};

const calculateCost = (
  numCards: number,
  freeSpace: boolean,
  autoMark: boolean
) => {
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
  await refreshCurrentGame(gameId);
};

const getReadyIds = () =>
  players.value.filter((p) => p.ready === true).map((p) => String(p.user_id));
</script>

<template>
  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
    <section class="space-y-6">
      <header class="space-y-1">
        <h1 class="text-3xl font-semibold">Bingo Games</h1>
      </header>

      <div
        v-if="isAdmin"
        class="space-y-3 rounded-lg border border-white/10 bg-gray-900/70 p-4 shadow-sm"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-white">Current Game Mode</p>
            <p class="text-xs text-gray-400">
              Adjust the lobby game before it starts. New games default to Classic unless changed later.
            </p>
          </div>
          <div class="w-full sm:w-64">
            <USelect
              v-if="isLobby && currentGame.game"
              v-model="currentGameModeDraft"
              :items="gameModeOptions"
              placeholder="Current game mode"
              @update:model-value="handleCurrentGameModeChange"
            />
            <UInput
              v-else
              :model-value="currentGame.game?.mode ?? 'classic'"
              disabled
              size="sm"
            />
          </div>
        </div>
        <p class="text-xs text-gray-400">
          <span class="font-semibold text-emerald-300">Strategy</span> enables
          multi-round scoring and XP tracking, while
          <span class="font-semibold text-blue-300">Classic</span> ends after the
          first verified bingo.
        </p>
      </div>

      <BingoAdminPricingControls
        v-if="isAdmin"
        v-model:selected-preset-id="selectedPricingPresetId"
        v-model:base-card-cost="baseCardCost"
        v-model:free-space-cost="freeSpaceCost"
        v-model:auto-mark-cost="autoMarkCost"
        :creating="bingoCreating"
        :preset-items="pricingPresetItems"
        :selected-preset="selectedPricingPreset"
        :bingo-message="bingoMessage"
        @create-game="handleCreateBingoGame"
        @delete-preset="handleDeletePricingPreset"
      />

      <div v-if="bingoLoading" class="text-gray-400">Loading games...</div>

      <div
        v-else-if="!currentGame.game"
        class="rounded-lg border border-dashed border-gray-700 p-6 text-gray-400"
      >
        <span v-if="isAdmin">
          No bingo games created yet. Create one to get started!
        </span>
        <span v-else>No live bingo games available right now.</span>
      </div>

      <div
        v-else
        :key="currentGame.game.id"
        class="space-y-6 rounded-lg bg-gray-800 p-6 shadow-sm"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-4">
              <p class="text-lg font-semibold">Current Game</p>
              <p v-if="isActive" class="text-sm text-green-400">
                💎 {{ currentGame.game.payout }}
              </p>
            </div>
            <div class="flex items-center justify-between gap-4 text-sm text-gray-400">
              <p>Status: {{ currentGame.game.status }}</p>
              <span
                class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
              >
                Mode: {{ currentGame.game.mode }}
              </span>
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

          <div v-if="isAdmin" class="flex items-start gap-3">
            <UInput
              v-if="isLobby"
              v-model.number="currentGame.game.payout"
              type="number"
              class="w-24 rounded border border-gray-600 bg-gray-900 p-1 text-sm text-white"
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

        <div v-if="isAdmin && isLobby" class="space-y-4 rounded-lg bg-gray-700 p-5">
          <h3 class="text-sm font-semibold text-gray-100">Issue Join Code</h3>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <UInput
              v-model="newContestant.username"
              placeholder="Username"
              size="sm"
              class="w-full border border-gray-600 bg-gray-900 text-white"
            />
            <UInput
              v-model.number="newContestant.numCards"
              type="number"
              min="1"
              placeholder="Cards"
              size="sm"
              class="w-full border border-gray-600 bg-gray-900 text-white"
            />

            <label class="flex items-center gap-2 text-xs text-gray-300">
              <input v-model="newContestant.freeSpace" type="checkbox" />
              <span>Free Space</span>
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-300">
              <input v-model="newContestant.autoMark" type="checkbox" />
              <span>Auto Mark</span>
            </label>
          </div>

          <p class="text-xs text-gray-400">
            Expected Cost:
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
            class="w-full"
            size="sm"
            color="primary"
            @click="handleIssueCode(currentGame.game.id)"
          >
            Generate Code
          </UButton>

          <p v-if="lastIssuedCode" class="text-xs text-green-400">
            Code issued: {{ lastIssuedCode }} for {{ lastContestantUsername }}
          </p>
        </div>

        <BingoGameControl
          v-if="isAdmin && currentGame.game"
          :game-status="currentGame.game.status"
          :game-id="gameIdRef"
          :mode="currentGame.game.mode"
          :draws="currentGame.draws"
          :contestants="currentGame.contestants"
          :loading="currentGame.loading"
          :auto-draw-running="isRunning"
          :ready-ids="getReadyIds()"
          :strategy-badges="strategyBadges"
          @draw="onDraw"
          @reload-game="handleReloadGame"
          @stop="onStop(gameIdRef)"
          @remove-contestant="handleRemoveContestant"
        />

        <div v-else class="space-y-3 rounded-lg bg-gray-700 p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-gray-300">
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
              class="order-3 w-full sm:order-2 sm:w-auto"
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
              class="order-2 w-full text-white sm:order-3 sm:w-24"
            />
          </div>

          <div class="flex flex-wrap gap-4 text-xs text-gray-300">
            <label class="flex items-center gap-2">
              <input
                v-model="loggedInContestant.freeSpace"
                :disabled="!!loggedInContestant.code"
                type="checkbox"
              />
              <span>Free Space</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="loggedInContestant.autoMark"
                :disabled="!!loggedInContestant.code"
                type="checkbox"
              />
              <span>Auto Mark</span>
            </label>
          </div>

          <p v-if="findGameCode(currentGame.game.id)" class="text-xs text-gray-200">
            Bingo Code: {{ findGameCode(profile?.id) }}
          </p>
        </div>
      </div>
    </section>

    <section v-if="isAdmin" class="space-y-6">
      <BingoRecentResultsList
        :results="recentResults"
        :loading="recentResultsLoading"
        :total="recentResultsTotal"
        :page="recentResultsPage"
        :page-size="recentResultsPageSize"
        :range-label="recentResultsRangeText"
        @page-change="handleRecentResultsPageChange"
      />

      <div v-if="showStrategyAdminPanel" class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-4 rounded-lg bg-gray-800 p-6 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-lg font-semibold text-white">
                Strategy Bingo Leaderboard
              </p>
              <p class="text-xs text-gray-400">
                Load standings by event or live game.
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                @click="handleApplyStrategySource"
              >
                Load
              </UButton>
              <UButton
                size="xs"
                color="gray"
                variant="soft"
                @click="handleClearStrategySource"
              >
                Clear
              </UButton>
              <UButton
                size="xs"
                color="gray"
                variant="ghost"
                icon="i-heroicons-arrow-path"
                @click="handleRefreshStrategyScores"
              />
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <UInput
              v-model="strategyFilters.eventId"
              size="sm"
              placeholder="Event ID"
            />
            <UInput
              v-model="strategyFilters.gameId"
              size="sm"
              placeholder="Game ID"
            />
          </div>

          <div class="rounded-lg border border-white/10 bg-black/20">
            <div class="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <p class="text-xs uppercase tracking-[0.3em] text-gray-400">
                Leaderboard
              </p>
              <span class="text-xs text-gray-400">
                {{ sortedStrategyLeaderboard.length }} players
              </span>
            </div>

            <div v-if="strategyScoresLoading" class="px-4 py-6 text-sm text-gray-400">
              Loading strategy scores...
            </div>
            <div
              v-else-if="!sortedStrategyLeaderboard.length"
              class="px-4 py-6 text-sm text-gray-400"
            >
              No strategy scores yet. Load an event to begin tracking.
            </div>
            <ul v-else class="divide-y divide-white/5">
              <li
                v-for="(entry, index) in sortedStrategyLeaderboard"
                :key="entry.lastScoreId"
                class="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div class="flex items-center gap-4">
                  <span class="text-xs text-gray-400">#{{ index + 1 }}</span>
                  <div>
                    <p class="font-medium text-white">
                      {{ entry.username || entry.contestantId }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ entry.code || "no code" }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold text-emerald-300">
                    {{ entry.totalPoints }}
                  </p>
                  <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                    pts
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div class="space-y-3 rounded-lg border border-white/10 bg-black/40 p-4">
            <div class="flex items-center justify-between">
              <p class="text-xs uppercase tracking-[0.3em] text-gray-400">
                Recent History
              </p>
              <span class="text-xs text-gray-500">
                Showing {{ limitedStrategyHistory.length }} of
                {{ strategyHistory.length }}
              </span>
            </div>

            <div v-if="!limitedStrategyHistory.length" class="text-sm text-gray-400">
              No rounds recorded yet.
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="row in limitedStrategyHistory"
                :key="row.id"
                class="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-xs"
              >
                <div>
                  <p class="font-semibold text-white">
                    {{ row.contestant?.username || row.contestant_id }}
                  </p>
                  <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                    {{ row.points_awarded }} pts · {{ new Date(row.created_at).toLocaleString() }}
                  </p>
                </div>
                <span class="text-[10px] text-gray-400">
                  {{ row.metadata?.notes || "Round " + (row.round_id || "n/a") }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div class="space-y-4 rounded-lg bg-gray-800 p-6 shadow-sm">
          <div>
            <p class="text-lg font-semibold text-white">
              Record Strategy Points
            </p>
            <p class="text-xs text-gray-400">
              Link points to an event and contestant; scores stream to the leaderboard above.
            </p>
          </div>

          <div class="space-y-3">
            <label class="text-xs uppercase tracking-[0.3em] text-gray-400">
              Contestant
            </label>
            <select
              v-model="strategyForm.contestantId"
              class="w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="" disabled>Select contestant</option>
              <option
                v-for="option in strategyContestantOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <p v-if="!currentGame.contestants.length" class="text-xs text-gray-400">
              Add contestants to the current game to award Strategy points.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <UInput
              v-model.number="strategyForm.pointsAwarded"
              type="number"
              min="0"
              label="Points"
              size="sm"
            />
            <UInput
              v-model="strategyForm.roundId"
              label="Round ID"
              size="sm"
              placeholder="Optional"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <UInput
              v-model="strategyFilters.eventId"
              label="Event ID"
              size="sm"
              placeholder="Required"
            />
            <UInput
              v-model="strategyForm.position"
              label="Position"
              size="sm"
              placeholder="Optional"
            />
          </div>

          <UTextarea
            v-model="strategyForm.metadataNotes"
            label="Notes"
            placeholder="Optional notes (stored in metadata)"
            :rows="3"
          />

          <div
            v-if="strategyFormMessage"
            :class="[
              'rounded-md px-3 py-2 text-sm',
              strategyFormMessageType === 'success'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-rose-500/10 text-rose-300',
            ]"
          >
            {{ strategyFormMessage }}
          </div>

          <UButton
            class="w-full"
            color="primary"
            :loading="strategyFormSubmitting"
            @click="handleRecordStrategyScore"
          >
            Record Points
          </UButton>
        </div>
      </div>

      <div class="rounded-lg bg-gray-800 p-6 shadow-sm">
        <BingoAdminTool
          :base-card-cost="baseCardCost"
          :free-space-cost="freeSpaceCost"
          :auto-mark-cost="autoMarkCost"
          :preset-name="selectedPricingPreset?.name ?? ''"
          :preset-payout-percentage="
            selectedPricingPreset?.payoutPercentage ?? null
          "
          @create-preset="handleCreatePricingPreset"
        />
      </div>
    </section>
  </main>
</template>
