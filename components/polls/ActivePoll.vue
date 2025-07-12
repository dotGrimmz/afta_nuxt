<script setup lang="ts">
import { ref } from "vue";

/* ---------- Props ---------- */

import type { Poll, PollOptionWithVotes } from "@/types/poll"; // Adjust the path as needed

const props = defineProps<{
  poll: Poll;
  loading?: boolean;
}>();

/* ---------- Emits ---------- */
const emit = defineEmits<{
  /** Parent handles the actual API call and state refresh */
  (e: "vote", payload: { pollId: number; optionId: string }): void;
}>();

/* ---------- Local UI state ---------- */
const voting = ref(false);
const errorMsg = ref("");
const options = ref<PollOptionWithVotes[]>([]);

watch(
  () => props.poll.poll_options,
  (newOpts) => {
    // Flatten votes if needed (depends on how normalized your prop is)
    options.value = newOpts.map((opt) => ({
      ...opt,
      votes: Array.isArray(opt.votes) ? opt.votes[0]?.count ?? 0 : opt.votes,
    }));
  },
  { immediate: true }
);

const { hasVoted, markVoted } = useVoteTracker(props.poll.id);

async function handleVote(optionId: string) {
  // if (voting.value || hasVoted.value) return;

  voting.value = true;
  errorMsg.value = "";

  try {
    emit("vote", { pollId: props.poll.id, optionId });
    // markVoted();

    // ✅ Optimistic update
    const target = options.value.find((o) => o.id === optionId);
    if (target) target.votes += 1;
  } catch (err: any) {
    errorMsg.value = err?.message || "Vote failed";
  } finally {
    voting.value = false;
  }
}

console.log(props.poll);
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-4">{{ props.poll.question }}</h2>

    <ul>
      <li
        v-for="opt in options"
        :key="opt.id"
        class="mb-2 flex justify-between"
      >
        <span>{{ opt.text }}</span>
        <button
          :disabled="voting || props.loading"
          @click="handleVote(opt.id)"
          class="border px-2 py-1 rounded"
        >
          Vote — {{ opt.votes }}
        </button>
      </li>
    </ul>

    <p v-if="errorMsg" class="text-red-600 mt-2">{{ errorMsg }}</p>
  </div>
</template>

<style scoped>
button {
  cursor: pointer;
}
</style>
