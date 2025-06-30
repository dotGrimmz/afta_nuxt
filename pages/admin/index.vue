<script setup lang="ts">
definePageMeta({ layout: "admin" });
// Update the path below if the file name or folder casing is different, e.g. PollsPollcreator.vue or pollsPollCreator.vue
import PollTile from "~/components/polls/PollTile.vue";
import type { Poll } from "~/types/poll";

const { data: pollsData, refresh } = await useFetch<Poll[]>("/api/polls");

const handleRefresh = async () => {
  console.log("Refreshing polls...");

  await refresh();
  console.log("Polls refreshed:", pollsData.value);
};
</script>

<template>
  <h1 class="text-3xl font-bold mb-6">Admin Dashboard</h1>

  <!-- Poll-creation widget -->
  <div>
    <PollsPollCreator @poll-created="handleRefresh" />
    <PollTile
      v-for="poll in pollsData"
      :key="poll.id"
      :poll="poll"
      @poll-updated="handleRefresh"
    />
  </div>
</template>
