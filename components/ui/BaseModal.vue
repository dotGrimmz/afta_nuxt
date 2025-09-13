<script setup lang="ts">
const isOpen = defineModel<boolean>("modelValue");

defineProps<{
  title?: string;
}>();

defineEmits(["close"]);
</script>

<template>
  <UModal
    v-model="isOpen"
    :overlay="true"
    :transition="true"
    :prevent-close="false"
    teleport="#modals"
    @close="$emit('close')"
  >
    <div class="p-6 space-y-4">
      <h2 v-if="title" class="text-xl font-bold">{{ title }}</h2>

      <!-- default slot -->
      <slot />

      <!-- optional actions slot -->
      <div class="flex justify-end gap-2 mt-4">
        <slot name="actions" />
      </div>
    </div>
  </UModal>
</template>
