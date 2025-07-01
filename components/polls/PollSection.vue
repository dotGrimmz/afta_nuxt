<script setup lang="ts">
/* open/closed state */
const open = ref(false);

function toggle() {
  open.value = !open.value;
}

const mockPollRes = {
  poll: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    question: "What's your favourite coding font?",
  },
  options: [
    { id: "opt1", text: "Fira Code", votes: { count: 12 } },
    { id: "opt2", text: "JetBrains Mono", votes: { count: 8 } },
    { id: "opt3", text: "Cascadia Code", votes: { count: 5 } },
    { id: "opt4", text: "Iosevka", votes: { count: 2 } },
  ] satisfies PollOption[],
};

const castVote = async (payload: { pollId: string; optionId: string }) => {
  // Placeholder for actual vote casting logic
  // In a real app, this would call an API to register the vote
  console.log(
    `Casting vote for poll ${payload.pollId}, option ${payload.optionId}...`
  );
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Vote cast successfully!");
};
import ActivePoll from "~/components/polls/ActivePoll.vue"; // Placeholder for actual poll component
import type { PollOption } from "~/types/poll";
</script>

<template>
  <!-- wrapper keeps card + dropdown grouped -->
  <div class="w-full">
    <!-- main card -->
    <SectionCard
      imageUrl="/images/black_sweater.jpg"
      objectFit="cover"
      objectPosition="bottom center"
      :onClick="toggle"
    >
      <h2 class="text-2xl font-bold mb-1">Polls</h2>
      <!-- <p class="text-sm leading-relaxed">
        Tap to view polls about AFTA’s features and preferences.
      </p> -->
    </SectionCard>

    <!-- animated dropdown -->
    <transition name="slide-fade">
      <div
        v-if="open"
        class="dropdown-content rounded-b-lg bg-white text-gray-800 p-4 border-t border-gray-200 shadow-inner"
      >
        <!-- 🔽  Add / replace with real poll component -->
        <slot>
          <ActivePoll
            v-if="mockPollRes"
            :poll="mockPollRes.poll"
            :options="mockPollRes.options"
            @vote="castVote"
          />
        </slot>
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

/* remove top-right-left radius so card + dropdown look like one block */
.dropdown-content {
  border-bottom-left-radius: 0.5rem; /* match card radius */
  border-bottom-right-radius: 0.5rem;
}
</style>
