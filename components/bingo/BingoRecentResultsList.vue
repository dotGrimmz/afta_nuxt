<script setup lang="ts">
import { computed } from "vue";
import type { BingoResultRow } from "~/types/bingo";

const props = defineProps<{
  results: BingoResultRow[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  rangeLabel?: string;
  title?: string;
}>();

const emit = defineEmits<{
  (e: "page-change", page: number): void;
}>();

const titleLabel = computed(() => props.title ?? "Recent Bingo Winners");

const handlePageChange = (page: number) => {
  if (page < 1) return;
  emit("page-change", page);
};

const showPagination = computed(
  () => props.total > props.pageSize && props.total > 0
);
</script>

<template>
  <div class="space-y-4 rounded-lg bg-gray-800 p-6 shadow-sm">
    <h2 class="text-xl font-semibold">{{ titleLabel }}</h2>

    <div v-if="loading" class="text-gray-400">Loading results...</div>
    <div v-else-if="!results.length" class="text-gray-400">No results yet.</div>

    <template v-else>
      <ul class="space-y-3">
        <li
          v-for="res in results"
          :key="res.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm"
        >
          <span>{{ res.username || res.contestant_id }}</span>
          <span class="text-green-400">{{ res.payout }} 💎</span>
          <span class="text-gray-400">
            {{ new Date(res.created_at).toLocaleString() }}
          </span>
        </li>
      </ul>

      <div
        v-if="total > 0"
        class="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p v-if="rangeLabel" class="text-xs text-gray-400">
          Showing {{ rangeLabel }}
        </p>

        <UPagination
          v-if="showPagination"
          :page="page"
          :items-per-page="pageSize"
          :total="total"
          :disabled="loading"
          size="xs"
          @update:page="handlePageChange"
        />
      </div>
    </template>
  </div>
</template>
