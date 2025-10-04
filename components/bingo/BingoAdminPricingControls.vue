<script setup lang="ts">
import { computed } from "vue";
import type { PricingPreset } from "~/composables/useBingoPricingPresets";

const selectedPresetIdModel = defineModel<string | undefined>(
  "selectedPresetId"
);
const baseCardCostModel = defineModel<number>("baseCardCost", {
  default: 0,
});
const freeSpaceCostModel = defineModel<number>("freeSpaceCost", {
  default: 0,
});
const autoMarkCostModel = defineModel<number>("autoMarkCost", {
  default: 0,
});

const props = defineProps<{
  creating: boolean;
  presetItems: { label: string; value: string }[];
  selectedPreset?: PricingPreset | null;
  bingoMessage?: string | null;
}>();

const emit = defineEmits<{
  (e: "create-game"): void;
  (e: "delete-preset", id: string): void;
}>();

const handleCreateGame = () => {
  emit("create-game");
};

const handleDeletePreset = () => {
  if (!props.selectedPreset) return;
  emit("delete-preset", props.selectedPreset.id);
};

const canDeleteSelectedPreset = computed(() => {
  const preset = props.selectedPreset;
  if (!preset) return false;
  return preset.metadata?.source !== "builtin";
});
</script>

<template>
  <div class="space-y-5 rounded-lg bg-gray-800 p-6 shadow-sm">
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <UButton
        :loading="creating"
        color="primary"
        class="w-full sm:w-auto"
        @click="handleCreateGame"
      >
        Create Game
      </UButton>

      <div class="w-full space-y-2 sm:max-w-md">
        <label class="block text-sm text-gray-300">Pricing Preset</label>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <USelect
            v-model="selectedPresetIdModel"
            :items="presetItems"
            placeholder="Select a preset"
            class="w-full"
          />
          <UButton
            v-if="canDeleteSelectedPreset"
            size="xs"
            color="error"
            variant="soft"
            class="w-full sm:w-auto"
            @click="handleDeletePreset"
          >
            Delete
          </UButton>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="space-y-2">
        <label class="block text-sm text-gray-300">Base Card Cost</label>
        <UInput v-model.number="baseCardCostModel" type="number" min="0" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm text-gray-300">Free Space Cost</label>
        <UInput v-model.number="freeSpaceCostModel" type="number" min="0" />
      </div>

      <div class="space-y-2">
        <label class="block text-sm text-gray-300">Auto Mark Cost</label>
        <UInput v-model.number="autoMarkCostModel" type="number" min="0" />
      </div>
    </div>

    <p v-if="bingoMessage" class="text-sm text-gray-300">
      {{ bingoMessage }}
    </p>
  </div>
</template>
