<script setup lang="ts">
import type { Database } from "~/types/supabase";
import { calculateCost } from "~/utils/bingo/pricing";

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
};

type ContestantType =
  Database["public"]["Tables"]["bingo_contestants"]["Row"][];

const {
  games: bingoGames,
  loading: bingoLoading,
  creating: bingoCreating,
  message: bingoMessage,
  createGame: createBingoGame,
  startGame: startBingoGame,
  stopGame,
  drawNumber,
  confirmWinner,
  joinGame: joinBingoGame,
  getState,
  issueJoinCode,
  getContestants,
} = useBingo() as {
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

const lastIssuedCode = ref<string | null>(null);

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

watch(
  bingoGames,
  async (games) => {
    if (!games || games.length === 0) return;

    const newState: Record<string, any> = {};
    for (const game of games) {
      newState[game.id] = {
        draws: [],
        winners: [],
        candidates: [],
        contestants: [],
        loading: true,
      };

      const fullState = await getState(game.id);

      newState[game.id] = { ...fullState, loading: false };
    }
    stateMap.value = newState;
  },
  { immediate: true } // 👈 run immediately too
);
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
              Code issued: {{ lastIssuedCode }}
            </p>
          </div>

          <!-- Contestant list -->
          <div
            v-if="
              stateMap[game.id]?.contestants &&
              (stateMap[game.id]?.contestants?.length ?? 0)
            "
            class="mt-4 bg-gray-700 p-3 rounded"
          >
            <h3 class="text-sm font-semibold text-gray-200 mb-2">
              Contestants
            </h3>
            <ul class="text-xs text-gray-300 space-y-1">
              <li
                v-for="c in stateMap[game.id].contestants"
                :key="c.id"
                class="flex justify-between"
              >
                <span>{{ c.username }} ({{ c.num_cards }} cards)</span>
                <span class="text-green-400">{{ c.code }}</span>
              </li>
            </ul>
          </div>

          <!-- Admin control panel -->
          <BingoGameControl
            v-if="profile?.role === 'admin'"
            :game="game"
            :draws="stateMap[game.id]?.draws || []"
            :winners="stateMap[game.id]?.winners || []"
            :candidates="stateMap[game.id]?.candidates || []"
            :loading="stateMap[game.id]?.loading ?? true"
            @draw="
              async (gameId) => {
                await drawNumber(gameId);
                const newState = await getState(gameId);
                stateMap.value = {
                  ...stateMap.value,
                  [gameId]: { ...newState, loading: false },
                };
              }
            "
            @stop="
              async (gameId) => {
                await stopGame(gameId);
                const newState = await getState(gameId);
                stateMap.value = {
                  ...stateMap.value,
                  [gameId]: { ...newState, loading: false },
                };
              }
            "
            @confirm="
              async ({ gameId, cardId, contestantId, payout }) => {
                await confirmWinner(gameId, cardId, contestantId, payout);
                const newState = await getState(gameId);
                stateMap.value = {
                  ...stateMap.value,
                  [gameId]: { ...newState, loading: false },
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
    </section>
  </main>
</template>
