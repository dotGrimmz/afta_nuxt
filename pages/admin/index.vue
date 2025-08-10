<template>
  <div class="min-h-screen">
    <!-- 1 col on mobile, 12 cols on md+ -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
      <!-- Creator: full width on mobile, 3/12 on sm+ -->
      <section class="sm:col-span-6">
        <PollsPollCreator @poll-created="refreshPolls" />
      </section>

      <!-- Tiles: full width on mobile, 9/12 on sm+ -->
      <section class="sm:col-span-6">
        <PollTile
          v-for="poll in pollsData"
          :key="poll.id"
          :poll="poll"
          @poll-updated="refreshPolls"
          :resetVotes="resetVotes"
          :loading="loading"
          :deletePoll="deletePoll"
        />
      </section>
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
