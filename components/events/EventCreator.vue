<script setup lang="ts">
const title = defineModel<string>("title");
const description = defineModel<string>("description");
const datetime = defineModel<string>("datetime");

const props = defineProps<{
  errors: { title?: string; datetime?: string };
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "reset"): void;
}>();

function onSubmit(e: Event) {
  e.preventDefault();
  emit("submit");
}
</script>

<template>
  <div class="max-w-xl w-full border border-gray-200 rounded-xl shadow-lg">
    <div class="px-5 py-4 border-b">
      <h2 class="text-lg font-semibold">Create Event</h2>
    </div>

    <form class="p-5 space-y-5" @submit="onSubmit">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium mb-1">Title</label>
        <input
          class="w-full border rounded-md px-3 py-2 outline-none focus:ring"
          v-model="title"
          placeholder="Team AMA"
          type="text"
        />
        <p v-if="props.errors.title" class="text-xs text-red-600 mt-1">
          {{ props.errors.title }}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Enter a short, descriptive title for your event
        </p>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium mb-1">Description</label>
        <textarea
          class="w-full border rounded-md px-3 py-2 outline-none focus:ring"
          v-model="description"
          rows="3"
          placeholder="Optional details..."
        />
      </div>

      <!-- Date & Time -->
      <div>
        <label class="block text-sm font-medium mb-1">Date &amp; Time</label>
        <input
          class="w-full border rounded-md px-3 py-2 outline-none focus:ring"
          v-model="datetime"
          type="datetime-local"
        />
        <p v-if="props.errors.datetime" class="text-xs text-red-600 mt-1">
          {{ props.errors.datetime }}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Your local time; will be converted to UTC automatically
        </p>
      </div>

      <div class="flex items-center gap-4">
        <button
          type="submit"
          class="px-6 py-2 rounded-lg bg-black text-white disabled:opacity-60"
          :disabled="props.submitting"
        >
          <span v-if="props.submitting">Creating…</span>
          <span v-else>Create</span>
        </button>

        <button
          type="button"
          class="px-6 py-2 rounded-lg border disabled:opacity-60"
          :disabled="props.submitting"
          @click="emit('reset')"
        >
          Reset
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
