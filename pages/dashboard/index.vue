<template>
  <div class="min-h-screen py-4">
    <div class="mx-auto max-w-6xl space-y-6">
      <!-- Row 1 -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch auto-rows-[clamp(18rem,40vh,26rem)] min-h-0"
      >
        <!-- Creator -->
        <section class="h-full min-h-0">
          <div class="h-full min-h-0 flex flex-col">
            <PollsPollCreator @poll-created="refreshPolls" />
          </div>
        </section>

        <!-- Tiles -->
        <section class="h-full min-h-0">
          <div class="h-full min-h-0 flex flex-col">
            <AnimatedList
              :displayScrollbar="false"
              class="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
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
          </div>
        </section>
      </div>

      <!-- Row 2 -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch auto-rows-[clamp(18rem,40vh,26rem)] min-h-0"
      >
        <section class="h-full min-h-0">
          <div class="h-full min-h-0 flex flex-col">
            <EventCreator
              v-model:title="eventForm.title"
              v-model:description="eventForm.description"
              v-model:datetime="eventForm.datetime"
              :errors="eventErrors"
              :submitting="submittingEvent"
              @submit="createEvent"
              @reset="resetEventForm"
            />
          </div>
        </section>

        <section class="h-full min-h-0">
          <div class="h-full min-h-0 flex flex-col overflow-hidden">
            <div
              class="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
              <EventsList
                :fmtDate="fmtDate"
                :fetchEvents="fetchEvents"
                :events="events"
                :loading="eventLoading"
                :errorMsg="eventErr"
                :handleDelete="deleteEvent"
              />
            </div>
          </div>
        </section>
      </div>
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

const {
  fetchEvents,
  fmtDate,
  handleDelete: deleteEvent,
  events,
  loading: eventLoading,
  errorMsg: eventErr,
  eventForm,
  eventErrors,
  submittingEvent,
  createEvent,
  resetEventForm,
} = useEventsAdmin();
definePageMeta({ layout: "dashboard" });
</script>
