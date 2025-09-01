<script setup lang="ts">
const { profile } = useProfile();
const {
  games,
  visibleGames,
  loading,
  creating,
  message,
  createGame,
  startGame,
  // endGame,
  joinGame,
} = useTrivia();

watch(visibleGames, () => {
  console.log("profile:", profile.value);
  console.log("all games:", toRaw(games.value));
  console.log("visibleGames:", toRaw(visibleGames.value));
});

const newGameTitle = ref("");
</script>

<template>
  <main class="p-2 space-y-4">
    <h1 class="text-2xl font-bold">Trivia Games</h1>

    <!-- Admin-only: Create Game Form -->
    <div
      v-if="profile?.role === 'admin'"
      class="bg-gray-800 p-4 rounded space-y-3"
    >
      <label class="block">
        <span class="text-sm text-gray-300">Game Title</span>
        <input
          v-model="newGameTitle"
          type="text"
          class="w-full mt-1 p-2 rounded bg-gray-900 border border-gray-600 text-white"
          placeholder="Enter a game title"
        />
      </label>

      <UButton
        :loading="creating"
        :disabled="!newGameTitle.trim()"
        :click="createGame"
        color="primary"
        class="w-full"
      >
        Create Game
      </UButton>

      <p v-if="message" class="text-sm mt-2">{{ message }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading">Loading games...</div>

    <!-- No games -->
    <div v-else-if="visibleGames.length === 0" class="text-gray-400">
      <span v-if="profile?.role === 'admin'">
        No games created yet. Create one to get started!
      </span>
      <span v-else> No live games available right now. </span>
    </div>

    <!-- Games list -->
    <div v-else>
      <div
        v-for="game in visibleGames"
        :key="game.id"
        class="p-2 my-2 bg-gray-800 rounded flex justify-between items-center"
      >
        <div>
          <p class="font-semibold">{{ game.title }}</p>
          <p class="text-sm text-gray-400">Status: {{ game.status }}</p>
        </div>

        <div class="flex gap-2">
          <!-- Admin controls -->
          <template v-if="profile?.role === 'admin'">
            <UButton :to="`/play/${game.id}`" size="sm">Open</UButton>
            <UButton
              v-if="game.status === 'lobby'"
              @click="startGame(game.id)"
              size="sm"
              color="primary"
            >
              Start
            </UButton>
            <UButton v-if="game.status !== 'ended'" size="sm" color="error">
              End
            </UButton>
          </template>

          <!-- Non-admin controls -->
          <template v-else>
            <UButton @click="joinGame(game.id)" size="sm" color="primary">
              Join
            </UButton>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>
