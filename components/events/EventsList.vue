<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Tables } from "~/types/supabase";
const { $toast } = useNuxtApp();

type EventRow = Tables<"events">;

const { add } = useToast();
const events = ref<EventRow[]>([]);
const loading = ref(false);
const errorMsg = ref<string | null>(null);

async function fetchEvents() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const { data, error } = await useFetch<EventRow[]>("/api/events/get", {
      method: "GET",
    });

    console.log(toRaw(data));
    if (error.value) {
      throw error.value;
    }
    events.value = data.value ?? [];
  } catch (e: any) {
    errorMsg.value = e?.message || "Failed to load events";
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    await $fetch(`/api/events/${id}`, { method: "DELETE" });
    $toast.success({ title: "Event deleted" });
    await fetchEvents();
  } catch (e: any) {
    $toast.error({
      title: "Delete failed",
      description: e?.message || "Unknown error",
      color: "error",
    });
  }
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso ?? "";
  }
}

onMounted(fetchEvents);

defineExpose({ refresh: fetchEvents });
</script>

<template>
  <div class="w-full max-w-3xl space-y-4">
    <h2 class="text-lg font-semibold">Upcoming Events</h2>

    <div v-if="errorMsg" class="p-3 text-red-600 text-sm">{{ errorMsg }}</div>

    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-20 w-full" v-for="i in 3" :key="i" />
    </div>

    <div v-else>
      <div v-if="events.length === 0" class="text-sm text-gray-500">
        No events yet. Create one to get started.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="event in events"
          :key="event.id"
          class="p-4 border border-gray-200 rounded-lg shadow-sm bg-white"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-base font-semibold text-gray-800">
              {{ event.title }}
            </h3>
            <span class="text-sm text-gray-500">{{ fmtDate(event.date) }}</span>
          </div>
          <p v-if="event.description" class="text-gray-700 mb-3">
            {{ event.description }}
          </p>
          <div class="flex justify-end">
            <UButton
              size="xs"
              color="error"
              variant="soft"
              @click="handleDelete(event.id)"
              >Delete</UButton
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
