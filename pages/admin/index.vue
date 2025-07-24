<script setup lang="ts">
definePageMeta({ layout: "admin" });
import PollTile from "~/components/polls/PollTile.vue";

const { polls: pollsData, refreshPolls, resetVotes, loading } = usePollAdmin();
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
      :resetVotes="resetVotes"
      :loading="loading"
    />
  </div>
</template>
