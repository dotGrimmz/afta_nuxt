<script setup lang="ts">
import { inject, ref } from "vue";
import ActivePoll from "~/components/polls/ActivePoll.vue";
import { useDeviceId } from "~/composables/useDeviceId";
import type { Poll } from "@/types/poll";

/* ▸ open / closed state for dropdown */
const open = ref(false);
function toggle() {
  open.value = !open.value;
}

const props = defineProps<{ poll: Poll }>();

/* ▸ handle vote (child ActivePoll emits { pollId, optionId }) */
async function castVote({
  pollId,
  optionId,
}: {
  pollId: number;
  optionId: string;
}) {
  try {
    await $fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      body: {
        option_id: optionId,
        voter_id: useDeviceId(), // local‑storage UUID
      },
    });
    // No manual refresh needed — realtime listener in useActivePoll updates counts
  } catch (err) {
    console.error("Vote failed:", err);
    // ActivePoll.vue already shows "Vote failed" if the endpoint returns an error
  }
}
</script>

<template>
  <!-- Wrapper keeps card + dropdown grouped -->
  <div class="w-full">
    <!-- Main card -->
    <SectionCard
      imageUrl="/images/black_sweater.jpg"
      objectFit="cover"
      objectPosition="bottom center"
      :onClick="toggle"
    >
      <h2 class="text-2xl font-bold mb-1">Polls</h2>
      <!-- optional tagline -->
      <!-- <p class="text-sm leading-relaxed">
        Tap to view polls about AFTA’s features and preferences.
      </p> -->
    </SectionCard>

    <!-- Animated dropdown -->
    <transition name="slide-fade">
      <div
        v-if="open"
        class="dropdown-content rounded-b-lg bg-white text-gray-800 p-4 border-t border-gray-200 shadow-inner"
      >
        <ActivePoll :poll="props.poll" :loading="false" @vote="castVote" />
      </div>
    </transition>
  </div>
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
}
</style>
