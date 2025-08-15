<script setup lang="ts">
import { ref } from "vue";

interface EventForm {
  title: string;
  description: string;
  datetime: string;
}

const emit = defineEmits<{
  (e: "created", event: any): void;
}>();

const { add } = useToast();

const loading = ref(false);
const form = ref<EventForm>({ title: "", description: "", datetime: "" });
const errors = ref<{ title?: string; datetime?: string }>({});

function validate() {
  errors.value = {};
  if (!form.value.title?.trim()) errors.value.title = "Title is required";
  if (!form.value.datetime) errors.value.datetime = "Date & time is required";
  return Object.keys(errors.value).length === 0;
}

function toIsoUtc(localDT: string): string {
  const d = new Date(localDT);
  return d.toISOString();
}

async function onSubmit() {
  if (!validate()) return;
  loading.value = true;
  try {
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description?.trim() || null,
      date: toIsoUtc(form.value.datetime),
    };

    const { data, error } = await useFetch("/api/events", {
      method: "POST",
      body: payload,
    });

    if (error.value) throw error.value;

    emit("created", data.value);
    form.value = { title: "", description: "", datetime: "" };
  } catch (e: any) {
    console.error({ e });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UCard class="max-w-xl w-full border border-gray-200 shadow-lg">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">Create Event</h2>
      </div>
    </template>

    <UForm :state="form" @submit.prevent="onSubmit" class="space-y-5">
      <UFormGroup
        label="Title"
        :error="errors.title"
        help="Enter a short, descriptive title for your event"
      >
        <UInput v-model="form.title" placeholder="Team AMA" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Description" help="Add any optional details">
        <UTextarea
          v-model="form.description"
          placeholder="Optional details..."
          :rows="3"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup label="Date & Time" :error="errors.datetime">
        <UInput v-model="form.datetime" type="datetime-local" class="w-full" />
        <p class="text-xs text-gray-500 mt-1">
          Your local time; will be converted to UTC automatically
        </p>
      </UFormGroup>

      <div class="flex items-center gap-4">
        <UButton
          type="submit"
          color="primary"
          :loading="loading"
          class="px-6 cursor-pointer"
          >Create</UButton
        >
        <UButton
          variant="soft"
          class="cursor-pointer"
          color="info"
          @click="form = { title: '', description: '', datetime: '' }"
          :disabled="loading"
          >Reset</UButton
        >
      </div>
    </UForm>
  </UCard>
</template>

<style scoped>
.UCard {
  background-color: white;
  border-radius: 0.75rem;
}
</style>
