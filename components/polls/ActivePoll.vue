<script lang="ts">
import type { Poll } from "@/types/poll"; // Adjust the path as needed
import { useToast } from "vue-toastification";
const toast = useToast();

const props = defineProps<{
  poll: Poll;
  loading?: boolean;
  refresh: () => void;
}>();

const emit = defineEmits<{
  /** Parent handles the actual API call and state refresh */
  (e: "vote", payload: { pollId: number; optionId: string }): void;
}>();

/* ---------- Local UI state ---------- */

console.log(toRaw(props.poll));

const { hasVoted, markVoted, selectedOptionId } = useVoteTracker(props.poll.id);
const { castVote, loading, error } = useActivePoll(props.poll.id);

console.log({ selectedOptionId });
async function handleVote(optionId: string) {
  if (hasVoted.value) {
    console.log("you have voted with this id:", toRaw(hasVoted.value));
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

  try {
    emit("vote", { pollId: props.poll.id, optionId });
    markVoted(optionId);

    // ✅ Optimistic update
    const target = props.poll.poll_options.find((o) => o.id === optionId);
    if (target) {
      // target.vote_count += 1; bump that show a loading icon or something
      toast.success(
        `You Voted "${target.text}" for ${props.poll.question} Poll - Success!`,
        {
          //@ts-ignore
          position: "bottom-left",
          timeout: 2000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          showCloseButtonOnHover: false,
        }
      );
    }
    await castVote(optionId);
    props.refresh();
  } catch (err: any) {
    console.error({ err });
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
          :disabled="loading || props.loading"
          @click="handleVote(opt.id)"
          :class="[
            'mb-2 flex justify-between border px-2 py-1 rounded',
            selectedOptionId === opt.id
              ? 'border-[1.5px] border-teal-500'
              : 'border-gray-300', // fallback/default border
          ]"
        >
          Vote — {{ opt.vote_count }}
        </button>
      </li>
    </ul>

    <template #footer v-if="error">
      <p class="text-red-600 mt-2">{{ error }}</p>
    </template>
  </UCard>
</template>

<style scoped>
button {
  cursor: pointer;
}
</style>
