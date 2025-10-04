<script setup lang="ts">
import type { Database } from "~/types/supabase";
import BaseModal from "~/components/BaseModal.vue";
import { useAutoDraw } from "~/composables/useAutoDraw";

import type {
  BingoCard,
  ContestantType,
  IssueJoinCodeResponse,
  UseBingo,
} from "~/types/bingo";

const supabase = useSupabaseClient<Database>();
const { profile, isAdmin } = useProfile();
const router = useRouter();

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
});

const recentResultsRangeText = computed(() => {
  if (!recentResultsTotal.value) return "";

  const start = (recentResultsPage.value - 1) * recentResultsPageSize.value + 1;
  const end = Math.min(
    recentResultsTotal.value,
    recentResultsPage.value * recentResultsPageSize.value
  );

  return `${start}-${end} of ${recentResultsTotal.value}`;
});

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

      <div v-if="isAdmin" class="space-y-5 rounded-lg bg-gray-800 p-6 shadow-sm">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UButton
            :loading="bingoCreating"
            color="primary"
            class="w-full sm:w-auto"
            @click="handleCreateBingoGame()"
          >
            Create Game
          </UButton>

          <div class="w-full space-y-2 sm:max-w-md">
            <label class="block text-sm text-gray-300">Pricing Preset</label>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <USelect
                v-model="selectedPricingPresetId"
                :items="pricingPresetItems"
                placeholder="Select a preset"
                class="w-full"
              />
              <UButton
                v-if="
                  selectedPricingPreset &&
                  selectedPricingPreset.metadata?.source !== 'builtin'
                "
                size="xs"
                color="error"
                variant="soft"
                class="w-full sm:w-auto"
                @click="handleDeletePricingPreset(selectedPricingPreset.id)"
              >
                Delete
              </UButton>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <label class="block text-sm text-gray-300">Base Card Cost</label>
            <UInput v-model="baseCardCost" type="number" min="0" class="w-full" />
          </div>

          <div class="space-y-2">
            <label class="block text-sm text-gray-300">Free Space Cost</label>
            <UInput v-model="freeSpaceCost" type="number" min="0" class="w-full" />
          </div>

          <div class="space-y-2">
            <label class="block text-sm text-gray-300">Auto Mark Cost</label>
            <UInput v-model="autoMarkCost" type="number" min="0" class="w-full" />
          </div>
        </div>

        <p v-if="bingoMessage" class="text-sm text-gray-300">
          {{ bingoMessage }}
        </p>
      </div>

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
          :draws="currentGame.draws"
          :contestants="currentGame.contestants"
          :loading="currentGame.loading"
          :auto-draw-running="isRunning"
          :ready-ids="getReadyIds()"
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
      <div class="space-y-4 rounded-lg bg-gray-800 p-6 shadow-sm">
        <h2 class="text-xl font-semibold">Recent Bingo Winners</h2>

        <div v-if="recentResultsLoading" class="text-gray-400">
          Loading results...
        </div>
        <div v-else-if="!recentResults.length" class="text-gray-400">
          No results yet.
        </div>

        <template v-else>
          <ul class="space-y-3">
            <li
              v-for="res in recentResults"
              :key="res.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm"
            >
              <span>{{ res.username || res.contestant_id }}</span>
              <span class="text-green-400">{{ res.payout }} 💎</span>
              <span class="text-gray-400">
                {{ new Date(res.created_at).toLocaleString() }}
              </span>
            </li>
          </ul>

          <div
            v-if="recentResultsTotal > 0"
            class="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p v-if="recentResultsRangeText" class="text-xs text-gray-400">
              Showing {{ recentResultsRangeText }}
            </p>

            <UPagination
              v-if="recentResultsTotal > recentResultsPageSize"
              :page="recentResultsPage"
              :items-per-page="recentResultsPageSize"
              :total="recentResultsTotal"
              :disabled="recentResultsLoading"
              size="xs"
              @update:page="handleRecentResultsPageChange"
            />
          </div>
        </template>
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
