<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <p class="text-sm text-gray-400">
        Convert between gold and diamonds using the standard event ratios.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormGroup
        label="Gold"
        description="Enter the gold amount to see the credited diamonds."
      >
        <UInput
          v-model.number="goldInput"
          type="number"
          min="0"
          icon="i-heroicons-banknotes-20-solid"
        />
      </UFormGroup>

      <UFormGroup
        label="Diamonds"
        description="Enter the diamond amount to see the gold requirement."
      >
        <UInput
          v-model.number="diamondInput"
          type="number"
          min="0"
          icon="i-heroicons-sparkles-20-solid"
        />
      </UFormGroup>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold">Gold → Diamonds</span>
            <UBadge color="primary" variant="soft">12.5 : 1k</UBadge>
          </div>
        </template>
        <p class="text-lg font-semibold">{{ goldToDiamondLabel }}</p>
        <p class="text-xs text-gray-400 mt-2">
          Every {{ ratio.gold.toLocaleString() }} gold credits
          {{ ratio.diamonds.toLocaleString() }} diamonds.
        </p>
      </UCard>

      <UCard>
        <template #header>
          <span class="text-sm font-semibold">Diamonds → Gold</span>
        </template>
        <p class="text-lg font-semibold">{{ diamondToGoldLabel }}</p>
        <p class="text-xs text-gray-400 mt-2">
          {{ ratio.diamonds.toLocaleString() }} diamonds converts back to
          {{ ratio.gold.toLocaleString() }} gold.
        </p>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <span class="text-sm font-semibold">Conversion Summary</span>
      </template>
      <ul class="space-y-2 text-sm text-gray-300">
        <li>
          Gold provided:
          <span class="text-emerald-300 font-semibold">{{
            formatNumber(goldInput)
          }}</span>
          → Diamonds credited:
          <span class="text-emerald-300 font-semibold">{{
            formatNumber(goldToDiamonds)
          }}</span>
        </li>
        <li>
          Diamonds provided:
          <span class="text-emerald-300 font-semibold">{{
            formatNumber(diamondInput)
          }}</span>
          → Gold converted:
          <span class="text-emerald-300 font-semibold">{{
            formatNumber(diamondToGold)
          }}</span>
        </li>
      </ul>

      <UAlert
        v-if="warning"
        :title="warning"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        class="mt-4"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const ratio = Object.freeze({
  gold: 100_000,
  diamonds: 8_000,
});

const goldInput = ref<number>(ratio.gold);
const diamondInput = ref<number>(ratio.diamonds);
const warning = ref<string>("");
let lastEdited: "gold" | "diamond" | null = null;

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);

const convertGoldToDiamonds = (gold: number) =>
  gold > 0 ? (gold / ratio.gold) * ratio.diamonds : 0;

const convertDiamondsToGold = (diamonds: number) =>
  diamonds > 0 ? (diamonds / ratio.diamonds) * ratio.gold : 0;

const goldToDiamonds = computed(() => convertGoldToDiamonds(goldInput.value));
const diamondToGold = computed(() => convertDiamondsToGold(diamondInput.value));

const goldToDiamondLabel = computed(
  () =>
    `${formatNumber(goldInput.value)} gold → ${formatNumber(
      goldToDiamonds.value
    )} diamonds`
);

const diamondToGoldLabel = computed(
  () =>
    `${formatNumber(diamondInput.value)} diamonds → ${formatNumber(
      diamondToGold.value
    )} gold`
);

watch(
  goldInput,
  (value) => {
    if (lastEdited === "gold") return;
    lastEdited = "gold";
    warning.value = "";

    if (value == null || value < 0) {
      warning.value = "Gold cannot be negative.";
      goldInput.value = Math.max(0, value || 0);
      lastEdited = null;
      return;
    }

    diamondInput.value = Number(convertGoldToDiamonds(value).toFixed(2));
    lastEdited = null;
  },
  { immediate: true }
);

watch(
  diamondInput,
  (value) => {
    if (lastEdited === "diamond") return;
    lastEdited = "diamond";
    warning.value = "";

    if (value == null || value < 0) {
      warning.value = "Diamonds cannot be negative.";
      diamondInput.value = Math.max(0, value || 0);
      lastEdited = null;
      return;
    }

    goldInput.value = Number(convertDiamondsToGold(value).toFixed(2));
    lastEdited = null;
  },
  { immediate: true }
);
</script>
