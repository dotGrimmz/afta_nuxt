<template>
  <form
    class="w-full h-full border border-gray-200 rounded-xl shadow-lg text-white flex flex-col"
    @submit.prevent="submit"
  >
    <!-- content -->
    <div class="flex-1 p-5 space-y-4 overflow-auto">
      <div>
        <label
          for="question"
          class="block text-sm mb-1.5 font-medium text-white"
        >
          Poll Question
        </label>
        <textarea
          id="question"
          v-model="question"
          rows="2"
          placeholder="Enter your poll question"
          class="w-full px-3 py-2 text-sm border rounded-md bg-white text-white placeholder-gray-400 outline-none focus:ring"
        ></textarea>
      </div>

      <div>
        <label
          for="options"
          class="block text-sm mb-1.5 font-medium text-white"
        >
          Options (comma-separated)
        </label>
        <input
          id="options"
          v-model="rawOptions"
          type="text"
          placeholder="Option A, Option B"
          class="w-full px-3 py-2 text-sm border rounded-md bg-white text-white placeholder-gray-400 outline-none focus:ring"
        />
      </div>
    </div>

    <!-- pinned footer -->
    <div class="p-4 rounded-b-xl">
      <UButton
        variant="outline"
        type="submit"
        :disabled="loading"
        class="px-5 py-2 rounded-lg bg-black text-white transition-colors hover:bg-black/90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {{ loading ? "Saving…" : "Create Poll" }}
      </UButton>
    </div>
  </form>
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
  if (!question.value.trim() || !rawOptions.value.trim()) return;

  const options = rawOptions.value
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  loading.value = true;
  try {
    await $fetch("/api/polls", {
      method: "POST",
      body: { question: question.value, options },
    });

    question.value = "";
    rawOptions.value = "";
    emit("poll-created");
    $toast.success("Poll Created!");
  } catch (e: any) {
    console.error(e);
    $toast.error("Poll creation error!");
  } finally {
    loading.value = false;
  }
}
</script>
