<script setup lang="ts">
defineProps<{
  winner_username?: string | undefined;
  winner_id?: string | undefined;
  payout?: string | number;
}>();

const emit = defineEmits<{ close: [boolean] }>();

// title should be game ended
//body should be winner name, winner id, payout,
// should refresh page?
</script>
<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    :title="`Winner ${winner_username} got Bingo!`"
  >
    <template #content>
      <div class="flex justify-between">
        <div class="flex">winner: {{ winner_username }}</div>

        <div class="flex">winner id: {{ winner_id }}</div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          label="Dismiss"
          @click="emit('close', false)"
        />
      </div>
    </template>
  </UModal>
</template>
