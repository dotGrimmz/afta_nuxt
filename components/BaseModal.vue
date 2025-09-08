<script setup lang="ts">
defineProps<{
  winner_username?: string | undefined;
  winner_id?: string | undefined;
  payout?: string | number;
}>();

const emit = defineEmits<{ close: [boolean] }>();
</script>
<template>
  <UModal
    :dismissible="false"
    :close="{ onClick: () => emit('close', true) }"
    :title="`Winner ${winner_username} got Bingo!`"
  >
    <template #body>
      <div class="flex justify-around">
        <div class="flex">
          winner: {{ winner_username }} is owed {{ payout }} 💎
        </div>

        <div class="flex">winner id: {{ winner_id }}</div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton color="success" label="Dismiss" @click="emit('close', true)" />
      </div>
    </template>
  </UModal>
</template>
