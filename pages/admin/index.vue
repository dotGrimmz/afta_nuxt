<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Admin Dashboard</h1>
    <PollsPollCreator @poll-created="refreshPolls" />

    <div
      class="relative z-10 flex flex-col gap-4 bg-black bg-opacity-80 p-4 min-h-screen"
    >
      <PollTile
        v-for="poll in pollsData"
        :key="poll.id"
        :poll="poll"
        @poll-updated="refreshPolls"
        :resetVotes="resetVotes"
        :loading="loading"
        :deletePoll="deletePoll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  polls: pollsData,
  refreshPolls,
  resetVotes,
  loading,
  deletePoll,
} = usePollAdmin();

definePageMeta({ layout: "admin" });
import PollTile from "~/components/polls/PollTile.vue";
</script>
