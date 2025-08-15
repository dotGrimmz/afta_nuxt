<template>
  <div class="min-h-screen">
    <!-- 1st row: Poll Creator + Poll Tiles -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-stretch mb-4">
      <!-- Creator -->
      <section class="sm:col-span-6 flex">
        <PollsPollCreator @poll-created="refreshPolls" />
      </section>

      <!-- Tiles -->
      <section class="sm:col-span-6 h-[300px] flex min-h-0 overflow-hidden">
        <AnimatedList
          :displayScrollbar="false"
          class="flex-1 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
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

    <!-- 2nd row: Event Creator -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-stretch">
      <section class="sm:col-span-6 flex">
        <EventCreator @created="handleEventCreated" />
      </section>
      <section class="sm:col-span-6 flex items-center justify-center">
        <!-- Optional: placeholder for event list or details -->
        <EventsList />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import PollTile from "~/components/polls/PollTile.vue";
import AnimatedList from "~/components/vue-bits/AnimatedList.vue";
import EventCreator from "~/components/events/EventCreator.vue";
import EventsList from "~/components/events/EventsList.vue";
const {
  polls: pollsData,
  refreshPolls,
  resetVotes,
  loading,
  deletePoll,
} = usePollAdmin();

definePageMeta({ layout: "admin" });

function handleEventCreated(event: any) {
  // Handle event creation (e.g., refresh event list)
  console.log("New event created:", event);
}
</script>
