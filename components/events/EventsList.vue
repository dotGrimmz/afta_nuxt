<script setup lang="ts">
import type { Tables } from "~/types/supabase";

type EventRow = Tables<"events">;

const props = defineProps<{
  events: EventRow[];
  fetchEvents: () => Promise<void>;
  loading: boolean;
  errorMsg: string | null;
  fmtDate: (iso?: string | null) => string;
  handleDelete: (id: string) => Promise<void>;
}>();

const { events, loading, errorMsg } = toRefs(props);
const hasEvents = computed(() => (props.events?.length ?? 0) > 0);
</script>

<template>
  <div class="w-full max-w-3xl h-full flex flex-col min-h-0">
    <!-- sticky header -->
    <div class="sticky top-0 z-10 backdrop-blur border rounded">
      <h2 class="text-lg font-semibold px-4 py-3">Upcoming Events</h2>
    </div>

    <!-- scrollable content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="errorMsg" class="p-3 text-red-600 text-sm">{{ errorMsg }}</div>

      <div v-if="loading" class="space-y-3">
        <USkeleton v-for="i in 3" :key="i" class="h-20 w-full" />
      </div>

      <div v-else>
        <div v-if="!hasEvents" class="text-sm text-gray-500">
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
              <span class="text-sm text-gray-500">{{
                fmtDate(event.date)
              }}</span>
            </div>
            <p v-if="event.description" class="text-gray-700 mb-3">
              {{ event.description }}
            </p>
            <div class="flex justify-end">
              <UButton
                size="xs"
                color="error"
                variant="solid"
                class="cursor-pointer"
                @click="handleDelete(event.id)"
              >
                Delete
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
