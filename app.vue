<script setup lang="ts">
import { provide } from "vue";
import { useActivePoll } from "~/composables/useActivePoll";

const { poll, options, loading } = useActivePoll();

/* Provide for any deep component */
provide("activePoll", poll);
provide("pollOptions", options);
provide("pollLoading", loading);
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
