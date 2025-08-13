<template>
  <div class="min-h-screen">
    <!-- 1 col on mobile, 12 cols on md+ -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-stretch">
      <!-- Creator: full width on mobile, 3/12 on sm+ -->
      <section class="sm:col-span-6 flex">
        <PollsPollCreator @poll-created="refreshPolls" />
      </section>

      <!-- Tiles: full width on mobile, 9/12 on sm+ -->
      <section class="sm:col-span-6 h-[300px] flex min-h-0 overflow-hidden">
        <AnimatedList
          :displayScrollbar="false"
          class="flex-1 h-full overflow-y-auto overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          :items="pollsData"
        >
          <template #default="{ item: poll }">
            <PollTile
              :key="poll.id"
              :poll="poll"
              @poll-updated="refreshPolls"
              :resetVotes="resetVotes"
              :loading="loading"
              :deletePoll="deletePoll"
            />
          </template>
        </AnimatedList>
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
import AnimatedList from "~/components/vue-bits/AnimatedList.vue";
</script>
