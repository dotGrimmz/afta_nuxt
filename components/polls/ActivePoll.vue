<script setup lang="ts">
import type { PollOption } from "@/types/poll";
interface PollData {
  poll: {
    id: string;
    question: string;
  };
  options: PollOption[];
}

const { data: pollRes, refresh } = await useFetch<PollData>(
  "/api/polls/active"
);
const deviceId = useDeviceId();
const voting = ref(false);
const errorMsg = ref("");

async function vote(optionId: string) {
  voting.value = true;
  errorMsg.value = "";
  try {
    if (!pollRes.value) {
      errorMsg.value = "Poll data not loaded.";
      voting.value = false;
      return;
    }
    //@ts-ignore
    await $fetch(`/api/polls/${pollRes.value.poll.id}/vote`, {
      method: "POST",
      body: { option_id: optionId, voter_id: deviceId },
    });
    await refresh(); // get updated counts
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || "Vote failed";
  } finally {
    voting.value = false;
  }
}
</script>

<template>
  <div v-if="pollRes">
    <h2 class="text-xl font-bold mb-4">{{ pollRes.poll.question }}</h2>

    <ul>
      <li
        v-for="opt in pollRes.options"
        :key="opt.id"
        class="mb-2 flex justify-between"
      >
        <span>{{ opt.text }}</span>
        <button
          :disabled="voting"
          @click="vote(opt.id)"
          class="border px-2 py-1 rounded"
        >
          Vote — {{ opt.votes?.count || 0 }}
        </button>
      </li>
    </ul>

    <p v-if="errorMsg" class="text-red-600 mt-2">{{ errorMsg }}</p>
  </div>
  <p v-else>No active poll.</p>
</template>
