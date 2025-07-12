<script setup lang="ts">
import { ref } from "vue";

/* ---------- Props ---------- */

import type { Poll } from "@/types/poll"; // Adjust the path as needed

const props = defineProps<{
  poll: Poll;
  loading?: boolean;
}>();

onMounted(() => {
  // This will log when the component is mounted
  // console.log("ActivePoll component mounted");
  // console.log("ActivePoll mounted with poll:", props.poll);
});

/* ---------- Emits ---------- */
const emit = defineEmits<{
  /** Parent handles the actual API call and state refresh */
  (e: "vote", payload: { pollId: number; optionId: string }): void;
}>();

/* ---------- Local UI state ---------- */
const voting = ref(false);
const errorMsg = ref("");

/* ---------- Click handler ---------- */

const { hasVoted, markVoted } = useVoteTracker(props.poll.id);

async function handleVote(optionId: string) {
  if (voting.value || hasVoted.value) return;

  voting.value = true;
  errorMsg.value = "";

  try {
    emit("vote", { pollId: props.poll.id, optionId });
    markVoted();
  } catch (err: any) {
    errorMsg.value = err?.message || "Vote failed";
  } finally {
    voting.value = false;
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-4">{{ props.poll.question }}</h2>

    <ul>
      <li
        v-for="opt in props.poll.poll_options"
        :key="opt.id"
        class="mb-2 flex justify-between"
      >
        <span>{{ opt.text }}</span>
        <button
          :disabled="voting || props.loading"
          @click="handleVote(opt.id)"
          class="border px-2 py-1 rounded"
        >
          Vote — {{ opt.poll_votes?.count ?? "0" }}
        </button>
      </li>
    </ul>

    <p v-if="errorMsg" class="text-red-600 mt-2">{{ errorMsg }}</p>
  </div>
</template>
