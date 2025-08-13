<template>
  <div class="poll-creator">
    <div class="form-group">
      <label for="question">Poll Question</label>
      <textarea
        id="question"
        v-model="question"
        rows="2"
        placeholder="Enter your poll question"
      ></textarea>
    </div>

    <div class="form-group">
      <label for="options">Options (comma-separated)</label>
      <input
        id="options"
        v-model="rawOptions"
        type="text"
        placeholder="Option A, Option B"
      />
    </div>

    <button :disabled="loading" @click="submit" class="submit-UButton">
      {{ loading ? "Saving…" : "Create Poll" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const { $toast } = useNuxtApp();

const question = ref("");
const rawOptions = ref("");

const loading = ref(false);

const emit = defineEmits<{
  (e: "poll-created"): void;
}>();

async function submit() {
  if (!question.value.trim() || !rawOptions.value.trim()) {
    return;
  }

  const options = rawOptions.value
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  loading.value = true;
  try {
    await $fetch("/api/polls", {
      method: "POST",
      body: {
        question: question.value,
        options,
      },
    }).then(() => {
      question.value = "";
      rawOptions.value = "";
      emit("poll-created");
      $toast.success("Poll Created!");
    });
  } catch (e: any) {
    $toast.success("Poll creation error!");
    console.error({ e });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.poll-creator {
  max-width: 600px;
  background-color: rgba(31, 41, 55, 0.7);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  color: white;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 500;
}

textarea,
input[type="text"] {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: none;
  border-radius: 6px;
  background-color: #f3f4f6;
  color: #111827;
}

textarea:focus,
input[type="text"]:focus {
  outline: 2px solid #2563eb;
  background-color: white;
}

.submit-button {
  background-color: #2563eb;
  color: white;
  font-weight: 600;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submit-button:hover {
  background-color: #1d4ed8;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
