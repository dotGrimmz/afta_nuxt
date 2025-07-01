<script setup lang="ts">
import { ref } from "vue";
import type { PollOptionWithVotes } from "@/types/poll";

/* ---------- Props ---------- */
const props = defineProps<{
  poll: { id: string; question: string };
  options: PollOptionWithVotes[];
  /** Optional flag if parent wants to show a global loading state */
  loading?: boolean;
}>();

/* ---------- Emits ---------- */
const emit = defineEmits<{
  /** Parent handles the actual API call and state refresh */
  (e: "vote", payload: { pollId: string; optionId: string }): void;
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
        v-for="opt in props.options"
        :key="opt.id"
        class="mb-2 flex justify-between"
      >
        <span>{{ opt.text }}</span>
        <button
          :disabled="voting || props.loading"
          @click="handleVote(opt.id)"
          class="border px-2 py-1 rounded"
        >
          Vote — {{ opt.votes?.count ?? 0 }}
        </button>
      </li>
    </ul>

    <p v-if="errorMsg" class="text-red-600 mt-2">{{ errorMsg }}</p>
  </div>
</template>

what I should do next is figure out a way to caputre unique votes without a user
needing to sign in. This could be done using browser storage (like localStorage)
to track if a user has already voted on a specific poll. This way, even if they
refresh or revisit the page, we can prevent duplicate votes from the same user.
However, this approach has limitations since users can clear their storage or
use incognito mode. I am ok with this approach for now as a temporary solution
until we implement a proper user authentication system.
