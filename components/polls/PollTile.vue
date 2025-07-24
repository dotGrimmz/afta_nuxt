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
        • {{ option.text }}
      </li>
    </ul>

    <!-- Activate button or status -->
    <div class="status-controls">
      <UButton
        v-if="!poll.is_active"
        @click="activatePoll"
        class="activate-button"
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
        :loading="props.loading"
        >Deactivate
      </UButton>
      <UButton
        label="Reset Poll Votes"
        color="secondary"
        size="md"
        @click="props.resetVotes(poll.id)"
        class="cursor-pointer"
        :loading="props.loading"
      >
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Poll } from "~/types/poll";
const { $toast } = useNuxtApp();

const props = defineProps<{
  poll: Poll;
  resetVotes: (id: Poll["id"]) => void;
  loading: boolean;
}>();

const emit = defineEmits<{ (e: "poll-updated"): void }>();

const activatePoll = async () => {
  if (props.poll.is_active) {
    console.log("Poll is active! no need to set to active! ");
    return;
  }
  try {
    await $fetch(`/api/polls/${props.poll.id}/activate`, {
      method: "POST",
    });
    emit("poll-updated");
    $toast.success("Poll Activated!");
  } catch (err) {
    console.error("Failed to activate poll:", err);
    $toast.error("Failed to activate poll");
  }
};

const deActivatePoll = async () => {
  if (!props.poll.is_active) {
    console.log("Poll is not activated DUMMY!");
    return;
  }
  try {
    await $fetch(`/api/polls/${props.poll.id}/deactivate`, {
      method: "POST",
    });
    emit("poll-updated");
    $toast.success("Poll Deactivateed!");
  } catch (err) {
    console.error("Failed to activate poll:", err);
    $toast.error("Failed to deactivate poll");
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
