<script setup lang="ts">
import { ref } from "vue";
import ActivePoll from "~/components/polls/ActivePoll.vue";
import { useDeviceId } from "~/composables/useDeviceId";
import { usePollAdmin } from "~/composables/usePollAdmin";

/* ▸ open / closed state for dropdown */
const open = ref(false);
function toggle() {
  open.value = !open.value;
}

/* we are getting our active polls list from the usePollAdmin hook
  then we want to map over each active poll tile with each tile having its own instance 
  of the useActive poll hook. 
*/

const { activePolls } = usePollAdmin();
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
      <p class="text-sm leading-relaxed">
        Tap to view polls about AFTA’s features and preferences.
      </p>
    </SectionCard>

    <!-- Animated dropdown -->
    <transition name="slide-fade">
      <div v-if="open" class="dropdown-content">
        <div
          class="active-poll-wrapper"
          v-if="activePolls.length"
          v-for="poll in activePolls"
          :key="poll.id"
        >
          <ActivePoll :poll="poll" />
        </div>
        <span v-else>...loading</span>
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
