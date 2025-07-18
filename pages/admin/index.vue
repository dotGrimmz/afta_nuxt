<script setup lang="ts">
definePageMeta({ layout: "admin" });
// Update the path below if the file name or folder casing is different, e.g. PollsPollcreator.vue or pollsPollCreator.vue
import PollTile from "~/components/polls/PollTile.vue";

// const { data: pollsData, refresh } = await useFetch<Poll[]>("/api/polls");

const { polls: pollsData, refreshPolls } = usePollAdmin();

// const activePolls = toRaw(pollsData.value)?.filter((poll) => poll.is_active);
console.log("all polls:", pollsData);
</script>

<template>
  <h1 class="text-3xl font-bold mb-6">Admin Dashboard</h1>

  <!-- Poll-creation widget -->
  <div>
    <PollsPollCreator @poll-created="refreshPolls" />
    <!-- this will be for the admin 
    so what I want to do is  fetch all polls
    group by active and non active
    all active tiles are shown on the screen
    -->

    <PollTile
      v-for="poll in pollsData"
      :key="poll.id"
      :poll="poll"
      @poll-updated="refreshPolls"
    />
  </div>
</template>
