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
  <!-- Fill parent height just like the poll creator -->
  <div
    class="w-full h-full border border-gray-200 rounded-xl shadow-lg flex flex-col min-h-0"
  >
    <div class="px-5 py-3 border-b">
      <h2 class="text-lg font-semibold">Create Event</h2>
    </div>

    <!-- Let the form take remaining space; trimmed padding/spacing -->
    <form class="flex-1 p-4 space-y-4 overflow-auto" @submit="onSubmit">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium mb-1">Title</label>
        <input
          v-model="title"
          class="w-full border rounded-md px-3 py-2 outline-none focus:ring"
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
          v-model="description"
          class="w-full border rounded-md px-3 py-2 outline-none focus:ring"
          rows="3"
          placeholder="Optional details..."
        />
      </div>

      <!-- Date & Time -->
      <div>
        <label class="block text-sm font-medium mb-1">Date &amp; Time</label>
        <input
          v-model="datetime"
          class="w-full border rounded-md px-3 py-2 outline-none focus:ring"
          type="datetime-local"
        />
        <p v-if="props.errors.datetime" class="text-xs text-red-600 mt-1">
          {{ props.errors.datetime }}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Your local time; will be converted to UTC automatically
        </p>
      </div>

      <div class="flex items-center gap-3 pt-1">
        <UButton
          type="submit"
          variant="outline"
          color="primary"
          class="px-5 py-2 rounded-lg bg-black text-white disabled:opacity-60 cursor-pointer"
          :disabled="props.submitting"
        >
          <span v-if="props.submitting">Creating…</span>
          <span v-else>Create</span>
        </UButton>

        <UButton
          type="button"
          variant="subtle"
          color="error"
          class="px-5 py-2 rounded-lg border disabled:opacity-60 cursor-pointer"
          :disabled="props.submitting"
          @click="emit('reset')"
        >
          Reset
        </UButton>
      </div>
    </form>
  </div>
</template>
