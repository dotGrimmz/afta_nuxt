<script setup lang="ts">
const { profile } = useProfile();

// Trivia composable (unchanged, already works)
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
} = useBingo();

const stateMap = ref<Record<string, { draws: number[]; winners: any[] }>>({});

onMounted(async () => {
  for (const game of bingoGames.value || []) {
    stateMap.value[game.id] = await getState(game.id);
  }
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

      <div v-if="triviaLoading">Loading games...</div>
      <div v-else-if="visibleTriviaGames.length === 0" class="text-gray-400">
        <span v-if="profile?.role === 'admin'">
          No trivia games created yet. Create one to get started!
        </span>
        <span v-else>No live trivia games available right now.</span>
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

      <div v-if="bingoLoading">Loading games...</div>
      <div
        v-else-if="!bingoGames || bingoGames.length === 0"
        class="text-gray-400"
      >
        <span v-if="profile?.role === 'admin'">
          No bingo games created yet. Create one to get started!
        </span>
        <span v-else>No live bingo games available right now.</span>
      </div>

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

            <!-- Inline: only Start -->
            <div v-if="profile?.role === 'admin'" class="flex gap-2">
              <UButton
                v-if="game.status === 'lobby'"
                @click="startBingoGame(game.id)"
                size="sm"
                color="primary"
              >
                Start
              </UButton>
            </div>
          </div>

          <!-- Admin control panel -->
          <BingoGameControl
            v-if="profile?.role === 'admin'"
            :game="game"
            :draws="stateMap[game.id]?.draws || []"
            :winners="stateMap[game.id]?.winners || []"
            @draw="
              async (gameId) => {
                await drawNumber(gameId);
                stateMap[gameId] = await getState(gameId);
              }
            "
            @stop="
              async (gameId) => {
                await stopGame(gameId);
                stateMap[gameId] = await getState(gameId);
              }
            "
            @confirm="
              async ({ gameId, cardId, contestantId }) => {
                await confirmWinner(gameId, cardId, contestantId, 1000);
                stateMap[gameId] = await getState(gameId);
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
