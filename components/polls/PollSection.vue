<script setup lang="ts">
import { ref } from "vue";
import ActivePoll from "~/components/polls/ActivePoll.vue";
import { usePollAdmin } from "~/composables/usePollAdmin";
import type { Poll } from "~/types/poll";
import AnimatedList from "~/components/vue-bits/AnimatedList.vue";

/* ▸ open / closed state for dropdown */
const open = ref(false);

const { activePolls, refreshPolls } = usePollAdmin();
</script>
<template>
  <!-- Wrapper keeps card + dropdown grouped -->
  <UCollapsible v-model:open="open">
    <!-- Main card -->

    <SectionCard
      imageUrl="/images/black_sweater.jpg"
      objectFit="cover"
      objectPosition="bottom center"
      class="h-[190px]"
    >
      <h2 class="text-2xl font-bold mb-1">Polls</h2>
      <p class="text-sm leading-relaxed">
        Tap to view polls about AFTA’s features and preferences.
      </p>
    </SectionCard>
    <template #content>
      <AnimatedList
        :displayScrollbar="false"
        className="w-[200px]"
        :items="activePolls"
      >
        <template #default="{ item: poll }">
          <ActivePoll :poll="poll" :refresh="refreshPolls" />
        </template>
      </AnimatedList>
    </template>
  </UCollapsible>
</template>

<style scoped>
/* slide-down / slide-up + fade */
.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 500px; /* large enough to fit content */
  opacity: 1;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

/* remove top-right-left radius so card + dropdown look unified */
.dropdown-content {
  border-bottom-left-radius: 0.5rem; /* match card radius */
  border-bottom-right-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
}

.active-poll-wrapper {
  display: flex;
  align-items: center;
  justify-self: center;
  width: 100%;
  padding: 0.5rem;
}
</style>
