<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BaseModal from "~/components/BaseModal.vue";
import { useAutoDraw } from "~/composables/useAutoDraw";

import type {
  BingoGameRow,
  BingoCard,
  ContestantType,
  GameMode,
  IssueJoinCodeResponse,
  StrategyBonusRules,
  StrategyScoreHistoryRow,
  UseBingo,
} from "~/types/bingo";
import type {
  PricingPreset,
  PricingPresetDraft,
} from "~/composables/useBingoPricingPresets";
import { formatStrategyAwardLabel } from "~/utils/strategy/formatAward";
import { computeStrategyPayout } from "~/utils/strategy/payout";

type PatternBonusOption = {
  id: string;
  label: string;
  description: string;
  defaultPoints: number;
};

const PATTERN_BONUS_OPTIONS: PatternBonusOption[] = [
  {
    id: "fourCorners",
    label: "Four Corners",
    description: "Card wins + bonus when all four corners are marked.",
    defaultPoints: 5,
  },
  {
    id: "x",
    label: "X Pattern",
    description: "Award extra points when both diagonals are completed.",
    defaultPoints: 15,
  },
];

const COMBO_BONUS_OPTION = {
  id: "combo",
  label: "Back-to-back Winner",
  description: "Bonus for contestants who win consecutive rounds.",
  defaultPoints: 10,
  defaultWindow: 1,
};

type StrategyBonusForm = {
  patterns: Record<
    string,
    {
      id: string;
      label: string;
      description: string;
      enabled: boolean;
      points: number;
    }
  >;
  combo: {
    enabled: boolean;
    points: number;
    window: number;
    label: string;
    description: string;
  };
};

const createBonusFormState = (
  rules?: StrategyBonusRules | null
): StrategyBonusForm => {
  const form: StrategyBonusForm = {
    patterns: {},
    combo: {
      enabled: false,
      points: COMBO_BONUS_OPTION.defaultPoints,
      window: COMBO_BONUS_OPTION.defaultWindow,
      label: COMBO_BONUS_OPTION.label,
      description: COMBO_BONUS_OPTION.description,
    },
  };

  for (const option of PATTERN_BONUS_OPTIONS) {
    const patternRule = rules?.patterns?.[option.id];
    form.patterns[option.id] = {
      id: option.id,
      label: option.label,
      description: option.description,
      enabled: !!patternRule && (patternRule.points ?? 0) > 0,
      points: patternRule?.points ?? option.defaultPoints,
    };
  }

  if (rules?.combo && (rules.combo.points ?? 0) > 0) {
    form.combo.enabled = true;
    form.combo.points = rules.combo.points ?? COMBO_BONUS_OPTION.defaultPoints;
    form.combo.window = rules.combo.window ?? COMBO_BONUS_OPTION.defaultWindow;
    form.combo.label = rules.combo.label ?? COMBO_BONUS_OPTION.label;
  }

  return form;
};

const serializeBonusForm = (form: StrategyBonusForm): StrategyBonusRules => {
  const patterns: StrategyBonusRules["patterns"] = {};
  for (const [id, config] of Object.entries(form.patterns)) {
    if (config.enabled && config.points > 0) {
      patterns![id] = {
        points: config.points,
        label: config.label,
      };
    }
  }

  const combo =
    form.combo.enabled && form.combo.points > 0
      ? {
          points: form.combo.points,
          window: form.combo.window,
          label: form.combo.label,
        }
      : undefined;

  return {
    patterns: Object.keys(patterns ?? {}).length ? patterns : undefined,
    combo,
  };
};

const applyBonusRulesToForm = (
  target: StrategyBonusForm,
  rules?: StrategyBonusRules | null
) => {
  const next = createBonusFormState(rules);
  for (const key of Object.keys(next.patterns)) {
    Object.assign(target.patterns[key], next.patterns[key]);
  }
  Object.assign(target.combo, next.combo);
};

const supabase = useSupabaseClient<Database>();
const patternBonusOptions = PATTERN_BONUS_OPTIONS;
const comboBonusOption = COMBO_BONUS_OPTION;
const { profile, isAdmin } = useProfile();
const router = useRouter();
const { $toast } = useNuxtApp();
const selectedGameMode = ref<GameMode>("classic");
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

const drawLimitModeOptions = [
  {
    label: "Unlimited · stop after winners",
    value: "unlimited",
  },
  {
    label: "Limit draws per round",
    value: "limited",
  },
];

const DRAW_LIMIT_MIN = 30;
const DRAW_LIMIT_MAX = 75;
const DEFAULT_EXCHANGE_RATE = 12.5;
const DEFAULT_CONVERSION_FEE = 0.0025;

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
  createDashboardController,
} = useBingo() as UseBingo;

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
  strategyRounds,
  strategyRoundsLoading,
  fetchStrategyScores,
  setStrategySource,
  fetchStrategyRounds,
  startStrategyAutomation,
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

const strategyDefaults = reactive({
  first: 50,
  second: 30,
  third: 10,
  requiredWinners: 1,
  totalRounds: 3,
});
const strategyDrawLimitDefaults = reactive({
  mode: "unlimited" as "unlimited" | "limited",
  value: 45,
});
const strategyBonusDefaultsForm = reactive(
  createBonusFormState({
    patterns: {
      fourCorners: { points: 5, label: "Four Corners" },
      x: { points: 15, label: "X Pattern" },
    },
    combo: {
      points: COMBO_BONUS_OPTION.defaultPoints,
      window: COMBO_BONUS_OPTION.defaultWindow,
      label: COMBO_BONUS_OPTION.label,
    },
  })
);

const strategyConfigForm = reactive({
  first: strategyDefaults.first,
  second: strategyDefaults.second,
  third: strategyDefaults.third,
  requiredWinners: strategyDefaults.requiredWinners,
  totalRounds: strategyDefaults.totalRounds,
});
const strategyConfigDrawLimitForm = reactive({
  mode: "unlimited" as "unlimited" | "limited",
  value: 45,
});
const strategyConfigBonusForm = reactive(createBonusFormState());
const strategyConfigMessage = ref<string | null>(null);
const strategyConfigMessageType = ref<"success" | "error" | null>(null);
const strategyConfigSaving = ref(false);
const strategyFormMessage = ref<string | null>(null);
const strategyFormMessageType = ref<"success" | "error" | null>(null);

const payoutConfig = reactive({
  currency: "diamond" as "gold" | "diamond",
  cardCost: 2000,
  cardsSold: 3,
  housePercent: 0.1,
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  conversionFee: DEFAULT_CONVERSION_FEE,
});

const payoutSplitInputs = reactive({
  first: 60,
  second: 25,
  third: 15,
});
const payoutCascadeEnabled = ref(true);
const payoutCascadeFirstPercent = ref(60);

const cascadeSplits = computed(() => {
  const base = Math.max(payoutCascadeFirstPercent.value, 1);
  const second = base / 2;
  const third = second / 2;
  const total = base + second + third;
  return {
    first: base / total,
    second: second / total,
    third: third / total,
  };
});

const payoutSplits = computed(() => ({
  first: payoutCascadeEnabled.value
    ? cascadeSplits.value.first
    : Math.max(payoutSplitInputs.first, 0) / 100,
  second: payoutCascadeEnabled.value
    ? cascadeSplits.value.second
    : Math.max(payoutSplitInputs.second, 0) / 100,
  third: payoutCascadeEnabled.value
    ? cascadeSplits.value.third
    : Math.max(payoutSplitInputs.third, 0) / 100,
}));

const payoutSplitTotal = computed(
  () =>
    (payoutCascadeEnabled.value
      ? 100
      : payoutSplitInputs.first +
        payoutSplitInputs.second +
        payoutSplitInputs.third)
);

const payoutCardsSold = computed(() =>
  Math.max(payoutConfig.cardsSold, totalContestantCards.value, 0)
);

const payoutPreview = computed(() =>
  computeStrategyPayout({
    currency: payoutConfig.currency,
    cardCost: payoutConfig.cardCost,
    cardsSold: Math.max(payoutCardsSold.value, 0),
    housePercent: payoutConfig.housePercent,
    splits: payoutSplits.value,
    exchangeRate: payoutConfig.exchangeRate,
    conversionFee: payoutConfig.conversionFee,
  })
);

const payoutPreviewError = computed(() =>
  "error" in payoutPreview.value ? payoutPreview.value.error : null
);

const payoutPreviewData = computed(() =>
  "error" in payoutPreview.value ? null : payoutPreview.value
);

const formatGoldAmount = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString()
    : "—";
const formatPercent = (fraction: number | undefined) =>
  typeof fraction === "number" && Number.isFinite(fraction)
    ? `${Math.round(fraction * 1000) / 10}%`
    : "—";

const syncStrategyConfigForm = () => {
  const game = currentGame.game;
  if (!game || game.mode !== "strategy") return;
  strategyConfigForm.first = game.strategy_first_place_points ?? strategyDefaults.first;
  strategyConfigForm.second =
    game.strategy_second_place_points ?? strategyDefaults.second;
  strategyConfigForm.third =
    game.strategy_third_place_points ?? strategyDefaults.third;
  strategyConfigForm.requiredWinners =
    game.strategy_required_winners ?? strategyDefaults.requiredWinners;
  strategyConfigForm.totalRounds =
    game.total_rounds ?? strategyDefaults.totalRounds;
  applyBonusRulesToForm(
    strategyConfigBonusForm,
    game.strategy_bonus_rules ?? {
      patterns: {
        fourCorners: { points: 5, label: "Four Corners" },
        x: { points: 15, label: "X Pattern" },
      },
      combo: {
        points: COMBO_BONUS_OPTION.defaultPoints,
        window: COMBO_BONUS_OPTION.defaultWindow,
        label: COMBO_BONUS_OPTION.label,
      },
    }
  );
  if (game.strategy_draw_limit_enabled) {
    strategyConfigDrawLimitForm.mode = "limited";
    strategyConfigDrawLimitForm.value =
      game.strategy_draw_limit ??
      Math.max(DRAW_LIMIT_MIN, strategyConfigDrawLimitForm.value);
  } else {
    strategyConfigDrawLimitForm.mode = "unlimited";
    strategyConfigDrawLimitForm.value =
      game.strategy_draw_limit ?? strategyDrawLimitDefaults.value;
  }
};

watch(
  () => currentGame.game,
  () => {
    syncStrategyConfigForm();
  },
  { immediate: true }
);

const handleCreateBingoGame = async () => {
  bingoLoading.value = true;

  try {
    if (
      selectedGameMode.value === "strategy" &&
      strategyDrawLimitDefaults.mode === "limited"
    ) {
      if (
        typeof strategyDrawLimitDefaults.value !== "number" ||
        strategyDrawLimitDefaults.value < DRAW_LIMIT_MIN
      ) {
        bingoMessage.value = `Draw limit must be at least ${DRAW_LIMIT_MIN} draws.`;
        return;
      }
      if (strategyDrawLimitDefaults.value > DRAW_LIMIT_MAX) {
        strategyDrawLimitDefaults.value = DRAW_LIMIT_MAX;
      }
    }

    const strategyPayload =
      selectedGameMode.value === "strategy"
        ? {
            first: strategyDefaults.first,
            second: strategyDefaults.second,
            third: strategyDefaults.third,
            requiredWinners: strategyDefaults.requiredWinners,
            totalRounds: strategyDefaults.totalRounds,
            drawLimitMode: strategyDrawLimitDefaults.mode,
            drawLimitValue: strategyDrawLimitDefaults.value,
            bonusRules: serializeBonusForm(strategyBonusDefaultsForm),
          }
        : undefined;
    const gameInitialized = await createBingoGame(
      selectedGameMode.value,
      strategyPayload
    );
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

const handleUpdateStrategyConfig = async () => {
  if (!isLobby.value || !isStrategyMode.value) {
    strategyConfigMessage.value =
      "Strategy settings are only editable in the lobby.";
    strategyConfigMessageType.value = "error";
    return;
  }

  const gameId = currentGame.game?.id;
  if (!gameId) return;

  strategyConfigSaving.value = true;
  strategyConfigMessage.value = null;
  strategyConfigMessageType.value = null;

  try {
    if (
      strategyConfigDrawLimitForm.mode === "limited" &&
      (typeof strategyConfigDrawLimitForm.value !== "number" ||
        strategyConfigDrawLimitForm.value < DRAW_LIMIT_MIN)
    ) {
      throw new Error(
        `Draw limit must be at least ${DRAW_LIMIT_MIN} draws.`
      );
    }
    if (
      strategyConfigDrawLimitForm.mode === "limited" &&
      strategyConfigDrawLimitForm.value > DRAW_LIMIT_MAX
    ) {
      strategyConfigDrawLimitForm.value = DRAW_LIMIT_MAX;
    }

    const response = await $fetch<{ game: BingoGameRow }>(
      `/api/bingo/games/${gameId}/strategy-config`,
      {
        method: "PATCH",
        body: {
          firstPlacePoints: strategyConfigForm.first,
          secondPlacePoints: strategyConfigForm.second,
          thirdPlacePoints: strategyConfigForm.third,
          requiredWinners: strategyConfigForm.requiredWinners,
          totalRounds: strategyConfigForm.totalRounds,
          drawLimitMode: strategyConfigDrawLimitForm.mode,
          drawLimitValue: strategyConfigDrawLimitForm.value,
          bonusRules: serializeBonusForm(strategyConfigBonusForm),
        },
      }
    );
    currentGame.game = response.game;
    syncStrategyConfigForm();
    strategyConfigMessage.value = "Strategy settings updated.";
    strategyConfigMessageType.value = "success";
  } catch (err: any) {
    strategyConfigMessage.value =
      err?.statusMessage ||
      err?.message ||
      "Failed to update strategy settings.";
    strategyConfigMessageType.value = "error";
  } finally {
    strategyConfigSaving.value = false;
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

const isStrategyMode = computed(
  () => currentGame.game?.mode === "strategy"
);
const showStrategyAdminPanel = computed(
  () => isAdmin.value && isStrategyMode.value
);
const strategyAutomationRunning = computed(() =>
  strategyRounds.value.some((round) => round.status === "active")
);
const activeStrategyRound = computed(() =>
  strategyRounds.value.find((round) => round.status === "active")
);
const canStartStrategyAutomation = computed(
  () =>
    isStrategyMode.value &&
    currentGame.game?.status === "active" &&
    !strategyAutomationRunning.value
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

const describeStrategyHistoryRow = (row: StrategyScoreHistoryRow): string =>
  formatStrategyAwardLabel({
    points: row.points_awarded,
    metadata: row.metadata,
    fallback: row.round_id ? `Round ${row.round_id}` : "Strategy Bingo",
  });

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
  const label = describeStrategyHistoryRow(score);
  const title = contestant?.username ? `${contestant.username} · ${label}` : label;

  $toast.success(title, {
    timeout: 2500,
    icon: "i-heroicons-sparkles-20-solid",
    description: score.round_id ? `Round ${score.round_id}` : "Strategy Bingo",
  });
};

const handleStartStrategyAutomation = async () => {
  const gameId = currentGame.game?.id;
  if (!gameId) return;
  try {
    await startStrategyAutomation(gameId);
    await fetchStrategyRounds(gameId);
    strategyFormMessage.value = "Strategy automation started.";
    strategyFormMessageType.value = "success";
  } catch (err: any) {
    strategyFormMessage.value =
      err?.statusMessage || err?.message || "Failed to start automation.";
    strategyFormMessageType.value = "error";
  }
};

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
    await fetchStrategyRounds(gameId);
  },
  { immediate: true }
);

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

watch(
  baseCardCost,
  (value) => {
    if (payoutConfig.currency === "diamond") {
      payoutConfig.cardCost = value;
    }
  },
  { immediate: true }
);

watch(
  () => payoutConfig.currency,
  (currency) => {
    if (currency === "diamond") {
      payoutConfig.cardCost = baseCardCost.value;
    }
  }
);

watch(
  totalContestantCards,
  (count) => {
    payoutConfig.cardsSold = Math.max(count, 3);
  },
  { immediate: true }
);

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
        class="space-y-6 rounded-lg border border-white/10 bg-gray-900/70 p-4 shadow-sm"
      >
        <div class="space-y-3">
          <div>
            <p class="text-sm font-semibold text-white">Next Game Mode</p>
            <p class="text-xs text-gray-400">
              Choose how the next game should behave. Strategy mode lets you configure default point values before creation.
            </p>
          </div>
          <div class="w-full sm:w-64">
            <USelect
              v-model="selectedGameMode"
              :items="gameModeOptions"
              placeholder="Select next game mode"
            />
          </div>
          <div
            v-if="selectedGameMode === 'strategy'"
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label class="space-y-1 text-xs font-semibold text-gray-300">
              <span>1st Place Points</span>
              <UInput
                v-model.number="strategyDefaults.first"
                type="number"
                size="sm"
                min="0"
                placeholder="Points for first winner"
              />
              <p class="text-[11px] font-normal text-gray-500">
                Awarded to the first confirmed contestant each round.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-300">
              <span>2nd Place Points</span>
              <UInput
                v-model.number="strategyDefaults.second"
                type="number"
                size="sm"
                min="0"
                placeholder="Points for second winner"
              />
              <p class="text-[11px] font-normal text-gray-500">
                Only applies when a second winner is confirmed.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-300">
              <span>3rd Place Points</span>
              <UInput
                v-model.number="strategyDefaults.third"
                type="number"
                size="sm"
                min="0"
                placeholder="Points for third winner"
              />
              <p class="text-[11px] font-normal text-gray-500">
                Optional bonus for third confirmations.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-300">
              <span>Winners Per Round</span>
              <UInput
                v-model.number="strategyDefaults.requiredWinners"
                type="number"
                size="sm"
                min="1"
                placeholder="Number of winners needed"
              />
              <p class="text-[11px] font-normal text-gray-500">
                Rounds end once this many contestants win.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-300 sm:col-span-2">
              <span>Total Rounds</span>
              <UInput
                v-model.number="strategyDefaults.totalRounds"
                type="number"
                size="sm"
                min="1"
                placeholder="How many rounds per game"
              />
              <p class="text-[11px] font-normal text-gray-500">
                Determines how many rounds automation will schedule.
              </p>
            </label>
          </div>
          <div
            v-if="selectedGameMode === 'strategy'"
            class="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4"
          >
            <div class="flex flex-col gap-1">
              <p class="text-sm font-semibold text-white">Round Draw Limit</p>
              <p class="text-xs text-gray-400">
                Default behavior ends a round after the required winners call bingo. Enable a draw limit to stop after a fixed number of draws (minimum {{ DRAW_LIMIT_MIN }}).
              </p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <USelect
                v-model="strategyDrawLimitDefaults.mode"
                :items="drawLimitModeOptions"
                size="sm"
                placeholder="Draw limit mode"
              />
              <UInput
                v-if="strategyDrawLimitDefaults.mode === 'limited'"
                v-model.number="strategyDrawLimitDefaults.value"
                type="number"
                size="sm"
                :min="DRAW_LIMIT_MIN"
                :max="DRAW_LIMIT_MAX"
                placeholder="e.g. 45 draws"
                label="Max Draws"
              />
            </div>
          </div>
          <div
            v-if="selectedGameMode === 'strategy'"
            class="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4"
          >
            <div class="flex flex-col gap-1">
              <p class="text-sm font-semibold text-white">Auto Bonus Checks</p>
              <p class="text-xs text-gray-400">
                Toggle which bonus patterns the auto-marker should detect during a round.
              </p>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <div
                v-for="pattern in patternBonusOptions"
                :key="pattern.id"
                class="space-y-2 rounded-md border border-white/10 bg-white/5 p-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-white">
                      {{ pattern.label }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ pattern.description }}
                    </p>
                  </div>
                  <USwitch
                    v-model="strategyBonusDefaultsForm.patterns[pattern.id].enabled"
                    aria-label="Toggle pattern bonus"
                  />
                </div>
                <UInput
                  v-if="strategyBonusDefaultsForm.patterns[pattern.id].enabled"
                  v-model.number="strategyBonusDefaultsForm.patterns[pattern.id].points"
                  size="xs"
                  type="number"
                  min="1"
                  :placeholder="`Bonus points for ${pattern.label}`"
                  label="Bonus Points"
                />
              </div>
            </div>
            <div class="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-white">
                    {{ comboBonusOption.label }}
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ comboBonusOption.description }}
                  </p>
                </div>
                <USwitch
                  v-model="strategyBonusDefaultsForm.combo.enabled"
                  aria-label="Toggle combo bonus"
                />
              </div>
              <div
                v-if="strategyBonusDefaultsForm.combo.enabled"
                class="grid gap-3 sm:grid-cols-2"
              >
                <UInput
                  v-model.number="strategyBonusDefaultsForm.combo.points"
                  label="Bonus Points"
                  type="number"
                  min="1"
                  size="xs"
                />
                <UInput
                  v-model.number="strategyBonusDefaultsForm.combo.window"
                  label="Consecutive Wins Window"
                  type="number"
                  min="1"
                  size="xs"
                />
              </div>
            </div>
          </div>
          <div
            v-if="selectedGameMode === 'strategy'"
            class="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4"
          >
            <div class="flex flex-col gap-1">
              <p class="text-sm font-semibold text-white">Payout Strategy Preview</p>
              <p class="text-xs text-gray-400">
                Estimate first/second/third payouts using current card pricing and split percentages.
              </p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <USelect
                v-model="payoutConfig.currency"
                :items="[
                  { label: 'Diamonds', value: 'diamond' },
                  { label: 'Gold', value: 'gold' },
                ]"
                size="sm"
                label="Currency"
              />
              <UInput
                v-model.number="payoutConfig.cardCost"
                :label="`Card Cost (${payoutConfig.currency === 'diamond' ? 'diamonds' : 'gold'})`"
                type="number"
                min="0"
                size="sm"
              />
              <UInput
                v-model.number="payoutConfig.cardsSold"
                label="Assumed Cards Sold"
                type="number"
                min="3"
                size="sm"
              />
              <UInput
                v-model.number="payoutConfig.housePercent"
                label="House Cut (0-1)"
                type="number"
                min="0"
                max="0.9"
                step="0.01"
                size="sm"
              />
              <div class="col-span-full flex items-center justify-between rounded border border-white/10 bg-white/5 p-3">
                <div>
                  <p class="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Cascading Split
                  </p>
                  <p class="text-[11px] text-gray-400">
                    Auto halves the share for 2nd and 3rd place, then normalizes to 100%.
                  </p>
                </div>
                <USwitch v-model="payoutCascadeEnabled" />
              </div>
              <div
                v-if="payoutCascadeEnabled"
                class="col-span-full grid gap-3 sm:grid-cols-2"
              >
                <UInput
                  v-model.number="payoutCascadeFirstPercent"
                  label="Base 1st Place %"
                  type="number"
                  min="10"
                  max="90"
                  size="sm"
                />
                <div class="rounded border border-white/10 bg-black/10 p-3 text-xs text-gray-300">
                  <p>Resulting splits:</p>
                  <p>🥇 {{ formatPercent(cascadeSplits.value.first) }}</p>
                  <p>🥈 {{ formatPercent(cascadeSplits.value.second) }}</p>
                  <p>🥉 {{ formatPercent(cascadeSplits.value.third) }}</p>
                </div>
              </div>
              <UInput
                v-model.number="payoutSplitInputs.first"
                label="1st Place %"
                type="number"
                min="0"
                max="100"
                size="sm"
                :disabled="payoutCascadeEnabled"
              />
              <UInput
                v-model.number="payoutSplitInputs.second"
                label="2nd Place %"
                type="number"
                min="0"
                max="100"
                size="sm"
                :disabled="payoutCascadeEnabled"
              />
              <UInput
                v-model.number="payoutSplitInputs.third"
                label="3rd Place %"
                type="number"
                min="0"
                max="100"
                size="sm"
                :disabled="payoutCascadeEnabled"
              />
              <UInput
                v-model.number="payoutConfig.exchangeRate"
                label="Exchange Rate (gold/diamond)"
                type="number"
                min="0"
                step="0.1"
                size="sm"
              />
            </div>
            <p class="text-[11px] text-gray-500">
              Split total: {{ payoutSplitTotal }}% · Conversion fee {{ (payoutConfig.conversionFee * 100).toFixed(2) }}%.
            </p>
            <div
              v-if="payoutPreviewError"
              class="rounded border border-red-400 bg-red-500/10 px-3 py-2 text-xs text-red-200"
            >
              {{ payoutPreviewError }}
            </div>
            <div
              v-else
              class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-200"
            >
              <div class="rounded border border-white/10 bg-white/5 p-3">
                <p class="text-xs uppercase tracking-[0.3em] text-gray-400">Spendable</p>
                <p class="text-lg font-semibold text-white">
                  {{ formatGoldAmount(payoutPreviewData?.spendable) }} gold
                </p>
                <p class="text-[11px] text-gray-400">
                  Per card: {{ payoutPreviewData?.notes?.perCard }}
                </p>
              </div>
              <div class="rounded border border-white/10 bg-white/5 p-3">
                <p class="text-xs uppercase tracking-[0.3em] text-gray-400">House Take</p>
                <p class="text-lg font-semibold text-white">
                  {{ formatGoldAmount(payoutPreviewData?.houseTake) }} gold
                </p>
                <p class="text-[11px] text-gray-400">
                  Prize pool: {{ formatGoldAmount(payoutPreviewData?.prizePool) }} gold
                </p>
              </div>
              <div class="rounded border border-white/10 bg-white/5 p-3">
                <p class="text-xs uppercase tracking-[0.3em] text-gray-400">Payouts</p>
                <ul class="space-y-1 text-[13px]">
                  <li>🥇 {{ formatGoldAmount(payoutPreviewData?.payouts?.first) }}</li>
                  <li>🥈 {{ formatGoldAmount(payoutPreviewData?.payouts?.second) }}</li>
                  <li>🥉 {{ formatGoldAmount(payoutPreviewData?.payouts?.third) }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <p class="text-sm font-semibold text-white">Current Game Mode</p>
            <p class="text-xs text-gray-400">
              You can only switch modes while the game is in the lobby.
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

        <div
          v-if="isAdmin && isLobby && isStrategyMode"
          class="space-y-4 rounded-lg bg-gray-700 p-5"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-100">
              Strategy Settings
            </h3>
            <span class="text-xs text-gray-400">
              Total Rounds: {{ currentGame.game?.total_rounds }}
            </span>
          </div>
          <p class="text-xs text-gray-400">
            Update round pacing and points before starting the game.
          </p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="space-y-1 text-xs font-semibold text-gray-200">
              <span>1st Place Points</span>
              <UInput
                v-model.number="strategyConfigForm.first"
                type="number"
                min="0"
                size="sm"
                placeholder="First winner payout"
              />
              <p class="text-[11px] font-normal text-gray-400">
                Base score for the fastest bingo each round.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-200">
              <span>2nd Place Points</span>
              <UInput
                v-model.number="strategyConfigForm.second"
                type="number"
                min="0"
                size="sm"
                placeholder="Second winner payout"
              />
              <p class="text-[11px] font-normal text-gray-400">
                Used only when a second winner is required.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-200">
              <span>3rd Place Points</span>
              <UInput
                v-model.number="strategyConfigForm.third"
                type="number"
                min="0"
                size="sm"
                placeholder="Third winner payout"
              />
              <p class="text-[11px] font-normal text-gray-400">
                Optional points for a third confirmed bingo.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-200">
              <span>Winners Per Round</span>
              <UInput
                v-model.number="strategyConfigForm.requiredWinners"
                type="number"
                min="1"
                size="sm"
                placeholder="Number of winners needed"
              />
              <p class="text-[11px] font-normal text-gray-400">
                Automation ends the round after this many winners.
              </p>
            </label>
            <label class="space-y-1 text-xs font-semibold text-gray-200 sm:col-span-2">
              <span>Total Rounds</span>
              <UInput
                v-model.number="strategyConfigForm.totalRounds"
                type="number"
                min="1"
                size="sm"
                placeholder="Rounds to schedule"
              />
              <p class="text-[11px] font-normal text-gray-400">
                Controls how many rounds are seeded for the current lobby game.
              </p>
            </label>
          </div>
          <div class="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
            <div class="flex flex-col gap-1">
              <p class="text-sm font-semibold text-white">Round Draw Limit</p>
              <p class="text-xs text-gray-400">
                Limit the number of automated draws or leave it unlimited to rely solely on winner count.
              </p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <USelect
                v-model="strategyConfigDrawLimitForm.mode"
                :items="drawLimitModeOptions"
                size="sm"
                placeholder="Draw limit mode"
              />
              <UInput
                v-if="strategyConfigDrawLimitForm.mode === 'limited'"
                v-model.number="strategyConfigDrawLimitForm.value"
                type="number"
                size="sm"
                :min="DRAW_LIMIT_MIN"
                :max="DRAW_LIMIT_MAX"
                label="Max Draws"
              />
            </div>
          </div>
          <div class="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4">
            <div class="flex flex-col gap-1">
              <p class="text-sm font-semibold text-white">Auto Bonus Checks</p>
              <p class="text-xs text-gray-400">
                Enable or disable pattern scans for the current lobby game.
              </p>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <div
                v-for="pattern in patternBonusOptions"
                :key="pattern.id"
                class="space-y-2 rounded-md border border-white/10 bg-white/5 p-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-white">
                      {{ pattern.label }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ pattern.description }}
                    </p>
                  </div>
                  <USwitch
                    v-model="strategyConfigBonusForm.patterns[pattern.id].enabled"
                    aria-label="Toggle pattern bonus"
                  />
                </div>
                <UInput
                  v-if="strategyConfigBonusForm.patterns[pattern.id].enabled"
                  v-model.number="strategyConfigBonusForm.patterns[pattern.id].points"
                  size="xs"
                  type="number"
                  min="1"
                  label="Bonus Points"
                />
              </div>
            </div>
            <div class="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-white">
                    {{ comboBonusOption.label }}
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ comboBonusOption.description }}
                  </p>
                </div>
                <USwitch
                  v-model="strategyConfigBonusForm.combo.enabled"
                  aria-label="Toggle combo bonus"
                />
              </div>
              <div
                v-if="strategyConfigBonusForm.combo.enabled"
                class="grid gap-3 sm:grid-cols-2"
              >
                <UInput
                  v-model.number="strategyConfigBonusForm.combo.points"
                  label="Bonus Points"
                  type="number"
                  min="1"
                  size="xs"
                />
                <UInput
                  v-model.number="strategyConfigBonusForm.combo.window"
                  label="Consecutive Wins Window"
                  type="number"
                  min="1"
                  size="xs"
                />
              </div>
            </div>
          </div>
          <div v-if="strategyConfigMessage" :class="[
              'rounded-md px-3 py-2 text-xs',
              strategyConfigMessageType === 'success'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-red-500/10 text-red-300',
            ]">
            {{ strategyConfigMessage }}
          </div>
          <UButton
            size="sm"
            color="primary"
            :loading="strategyConfigSaving"
            @click="handleUpdateStrategyConfig"
          >
            Save Strategy Settings
          </UButton>
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
        <div class="space-y-4 rounded-lg bg-gray-800 p-6 shadow-sm lg:col-span-2">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-lg font-semibold text-white">Strategy Automation</p>
              <p class="text-xs text-gray-400">
                Manage automatic rounds, draws, and scoring for the current game.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                v-if="canStartStrategyAutomation"
                size="sm"
                color="primary"
                @click="handleStartStrategyAutomation"
              >
                Start Automation
              </UButton>
              <UBadge
                v-else
                size="sm"
                class="uppercase tracking-[0.3em]"
                :color="strategyAutomationRunning ? 'green' : 'gray'"
              >
                {{ strategyAutomationRunning ? "Running" : "Idle" }}
              </UBadge>
            </div>
          </div>

          <div v-if="strategyRoundsLoading" class="text-sm text-gray-400">
            Loading rounds...
          </div>
          <div v-else-if="!strategyRounds.length" class="text-sm text-gray-400">
            Rounds will appear here once the game enters Strategy mode.
          </div>
          <ul v-else class="space-y-2">
            <li
              v-for="round in strategyRounds"
              :key="round.id"
              class="flex items-center justify-between rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
              :class="{
                'border-emerald-400 text-emerald-200': round.status === 'active',
                'opacity-60': round.status === 'completed',
              }"
            >
              <div>
                <p class="font-semibold">
                  Round {{ round.round_number }} · {{ round.status }}
                </p>
                <p class="text-xs text-gray-400" v-if="round.started_at">
                  Started: {{ new Date(round.started_at).toLocaleTimeString() }}
                </p>
                <p class="text-xs text-gray-400" v-else>Pending start</p>
              </div>
              <div class="text-right text-xs text-gray-400">
                <p v-if="currentGame.game?.strategy_draw_limit_enabled">
                  Draw limit: {{ round.draws_per_round }}
                </p>
                <p v-else>No draw limit</p>
                <p>Interval: {{ round.draw_interval_seconds }}s</p>
              </div>
            </li>
          </ul>
        </div>
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
                  {{ describeStrategyHistoryRow(row) }}
                </span>
              </li>
            </ul>
          </div>
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
