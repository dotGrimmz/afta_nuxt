<template>
  <div class="poll-tile" :class="{ active: poll.isActive }">
    <h2 class="poll-question">{{ poll.question }}</h2>

    <ul class="poll-options">
      <li v-for="option in poll.options" :key="option.id" class="poll-option">
        {{ option.text }} ({{ option.votes }} votes)
      </li>
    </ul>

    <button @click="toggleActive" class="toggle-button">
      {{ poll.isActive ? "Deactivate Poll" : "Activate Poll" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import type { Poll } from "~/types/poll";

const props = defineProps<{ poll: Poll }>();

// Clone poll so we can mutate local state
const poll = reactive({ ...props.poll });

function toggleActive() {
  poll.isActive = !poll.isActive;
}
</script>

<style scoped>
.poll-tile {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  color: black;
  background-color: #eee;
  width: 320px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
}

.poll-tile.active {
  background-color: #ffe0e0;
  border-color: #f44336;
}

.poll-question {
  font-weight: bold;
  font-size: 1.2rem;
}

.poll-options {
  list-style-type: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.poll-option {
  padding: 4px 0;
}

.toggle-button {
  align-self: flex-end;
  margin-top: auto;
  padding: 6px 12px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
