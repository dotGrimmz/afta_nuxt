<template>
  <div
    :class="`poll-tile shadow-lg ${props.poll.is_active ? 'active-tile' : ''}`"
  >
    <!-- Question -->
    <h2 class="poll-question">{{ poll.question }}</h2>

    <!-- Options -->
    <ul class="poll-options">
      <li
        v-for="option in poll.poll_options"
        :key="option.id"
        class="poll-option"
      >
        • {{ option.text }} - {{ option.vote_count }}
      </li>
    </ul>

    <!-- Activate button or status -->
    <div class="status-controls">
      <UButton
        v-if="!poll.is_active"
        @click="activatePoll"
        :loading="pollLoading"
        class="activate-button cursor-pointer"
      >
        Activate
      </UButton>
      <UButton
        v-else
        @click="deActivatePoll"
        label="Deactivate"
        size="md"
        color="primary"
        variant="solid"
        class="cursor-pointer"
        :loading="pollLoading"
        >Deactivate
      </UButton>
      <UButton
        label="Reset Poll Votes"
        color="secondary"
        size="md"
        @click="handleReset(poll.id)"
        class="cursor-pointer"
        :loading="votesResetting"
      >
      </UButton>
      <UButton
        size="md"
        class="cursor-pointer"
        color="error"
        label="Delete Poll"
        @click="handelPollDeletion(poll.id)"
        :loading="pendingPollDeletion"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Poll } from "~/types/poll";
const { $toast } = useNuxtApp();
const pollLoading = ref(false);
const votesResetting = ref(false);
const pendingPollDeletion = ref(false);

const props = defineProps<{
  poll: Poll;
  resetVotes: (id: Poll["id"]) => void;
  loading: boolean;
  deletePoll: (id: Poll["id"]) => void;
}>();

const emit = defineEmits<{ (e: "poll-updated"): void }>();

const handelPollDeletion = async (id: Poll["id"]) => {
  pendingPollDeletion.value = true;
  try {
    props.deletePoll(id);
    emit("poll-updated");
    $toast.info("Poll Deleted!");
  } catch (e) {
    console.error(e);
  } finally {
    pendingPollDeletion.value = false;
  }
};

const handleReset = async (id: Poll["id"]) => {
  votesResetting.value = true;
  try {
    props.resetVotes(id);
    emit("poll-updated");
  } catch (e) {
    console.error(e);
  } finally {
    votesResetting.value = false;
  }
};
const activatePoll = async () => {
  if (props.poll.is_active) {
    console.log("Poll is active! no need to set to active! ");
    return;
  }
  pollLoading.value = true;
  try {
    await $fetch(`/api/polls/${props.poll.id}/activate`, {
      method: "POST",
    });
    emit("poll-updated");
    $toast.success("Poll Activated!");
  } catch (err) {
    console.error("Failed to activate poll:", err);
    $toast.error("Failed to activate poll");
  } finally {
    pollLoading.value = false;
  }
};

const deActivatePoll = async () => {
  if (!props.poll.is_active) {
    console.log("Poll is not activated DUMMY!");
    return;
  }
  pollLoading.value = true;

  try {
    await $fetch(`/api/polls/${props.poll.id}/deactivate`, {
      method: "POST",
    });
    emit("poll-updated");
    $toast.success("Poll Deactivateed!");
  } catch (err) {
    console.error("Failed to activate poll:", err);
    $toast.error("Failed to deactivate poll");
  } finally {
    pollLoading.value = false;
  }
};
</script>

<style scoped>
.poll-tile {
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 480px;
  margin: 1rem auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.poll-question {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.5rem;
}

.poll-options {
  list-style: none;
  padding: 0;
  margin: 0;
}

.poll-option {
  padding: 6px 0;
  color: #333;
  font-size: 0.95rem;
}

.status-controls {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.active-tile {
  background-color: #f8d7da;
}

.activate-button {
  background-color: #0070f3;
  color: white;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.activate-button:hover {
  background-color: #005dc1;
}

.status-label {
  font-weight: bold;
  color: #28a745;
  font-size: 0.95rem;
}
</style>
