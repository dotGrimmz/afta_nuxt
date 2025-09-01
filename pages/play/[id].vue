<script setup lang="ts">
import type { Database } from "~/types/supabase";
import { useRoute } from "vue-router";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

const route = useRoute();
const supabase = useSupabaseClient<Database>();

// shared game state
const game = useState<GameRow | null>("game", () => null);
const loading = useState("game-loading", () => true);

onMounted(async () => {
  const { data, error } = await supabase
    .from("games")
    .select("id, title, status, created_at")
    .eq("id", route.params.id as string)
    .single();

  if (!error && data) {
    game.value = data;
  }

  loading.value = false;
});

onMounted(async () => {
  // 1. join the game as contestant
  try {
    await $fetch(`/api/games/${route.params.id}/join`, { method: "POST" });
  } catch (err) {
    console.error("Failed to join game:", err);
  }

  // 2. load game details
  const { data, error } = await supabase
    .from("games")
    .select("id, title, status, created_at")
    .eq("id", route.params.id as string)
    .single();

  if (!error && data) {
    game.value = data;
  }

  loading.value = false;
});
</script>

<template>
  <main class="p-6">
    <div v-if="loading">Loading game...</div>

    <div v-else-if="!game">
      <p class="text-red-400">Game not found.</p>
    </div>

    <div v-else>
      <h1 class="text-2xl font-bold">{{ game.title }}</h1>
      <p class="text-gray-400">Status: {{ game.status }}</p>

      <div v-if="game.status === 'lobby'" class="mt-4">
        <p>Waiting for host to start the game…</p>
      </div>

      <div v-else-if="game.status === 'live'" class="mt-4">
        <p>The game is now live!</p>
        <!-- later: trivia questions, buzzer, etc -->
      </div>

      <div v-else-if="game.status === 'ended'" class="mt-4">
        <p>Game has ended.</p>
      </div>
    </div>
  </main>
</template>
