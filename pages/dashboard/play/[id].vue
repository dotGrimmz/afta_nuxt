<script setup lang="ts">
import { ref, onMounted } from "vue";

const route = useRoute();
const game = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  const res = await $fetch(`/api/games/${route.params.id}`);
  game.value = res;
  loading.value = false;
});
</script>

<template>
  <main class="p-6 space-y-4">
    <div v-if="loading">Loading game...</div>

    <div v-else>
      <h1 class="text-2xl font-bold">{{ game.title }}</h1>
      <p>Status: {{ game.status }}</p>

      <div class="mt-4">
        <h2 class="text-lg font-semibold">Host</h2>
        <p>{{ game.host.display_name }}</p>
      </div>

      <div class="mt-4">
        <h2 class="text-lg font-semibold">Contestants</h2>
        <ul>
          <li v-for="c in game.contestants" :key="c.user_id">
            {{ c.display_name }} (Score: {{ c.score }})
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>
