<script setup lang="ts">
import { ref } from "vue";
import type { Poll } from "@/types/poll"; // Adjust the path as needed
import { useToast } from "vue-toastification";
const toast = useToast();

const props = defineProps<{
  poll: Poll;
  loading?: boolean;
}>();

const emit = defineEmits<{
  /** Parent handles the actual API call and state refresh */
  (e: "vote", payload: { pollId: number; optionId: string }): void;
}>();

/* ---------- Local UI state ---------- */
const voting = ref(false);
const errorMsg = ref("");

console.log(toRaw(props.poll));

const { hasVoted, markVoted } = useVoteTracker(props.poll.id);

async function handleVote(optionId: string) {
  if (voting.value || hasVoted.value) {
    console.log(
      "you have voted with this id:",
      toRaw(voting.value),
      toRaw(hasVoted.value)
    );
    toast.warning("Voted Already Ninja! - GO Away already", {
      //@ts-ignore
      position: "bottom-left",
      timeout: 2000,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      showCloseButtonOnHover: false,
    });

    return;
  }

  voting.value = true;
  errorMsg.value = "";

  try {
    emit("vote", { pollId: props.poll.id, optionId });
    markVoted();

    // ✅ Optimistic update
    const target = props.poll.poll_options.find((o) => o.id === optionId);
    if (target) target.vote_count += 1;
  } catch (err: any) {
    errorMsg.value = err?.message || "Vote failed";
  } finally {
    voting.value = false;
  }
}
</script>

<template>
  <UCard
    variant="solid"
    class="container shadow-lg p-2 hover:shadow-xl transform hover:-translate-y-1 transition duration-300 hover:bg-yellow-200"
  >
    <template #header>
      <h2 class="text-xl font-bold mb-4">{{ props.poll.question }}</h2>
    </template>

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
          Vote — {{ opt.vote_count }}
        </button>
      </li>
    </ul>

    <template #footer v-if="errorMsg">
      <p class="text-red-600 mt-2">{{ errorMsg }}</p>
    </template>
  </UCard>
</template>

<style scoped>
button {
  cursor: pointer;
}
</style>
