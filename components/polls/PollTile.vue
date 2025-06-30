<template>
  <div class="poll-tile">
    <h2 class="poll-question">{{ poll.question }}</h2>
    <ul class="poll-options">
      <li v-for="option in poll.options" :key="option.text">
        {{ option.text }}
      </li>
    </ul>

    <button v-if="!poll.isActive" @click="activatePoll" class="activate-button">
      Activate
    </button>

    <p v-else class="status-label">✅ Active Poll</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import type { Poll } from "~/types/poll";

const props = defineProps<{ poll: Poll }>();
const { poll } = props;
const { id, options } = poll as Poll;
const emit = defineEmits<{ (e: "poll-updated"): void }>();

const activatePoll = async () => {
  try {
    await $fetch(`/api/polls/${poll.id}/activate`, { method: "POST" });

    emit("poll-updated");
  } catch (err) {
    console.error("Failed to activate poll:", err);
  }
};
</script>

<style scoped>
.status-label {
  font-weight: bold;
  color: green;
}
.activate-button {
  background-color: #0070f3;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
