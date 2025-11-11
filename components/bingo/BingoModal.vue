<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps<{
  modelValue: boolean; // control open/close
  title?: string; // optional heading
  numbers: number[]; // list of all drawn numbers
  restoreMarks: () => void;
  gameEnded: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const close = () => {
  emit("update:modelValue", false);
};

// Close when clicking on backdrop (outside modal box)
const onBackdropClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).id === "bingo-modal-backdrop") {
    close();
  }
};

const handleRestoreMarks = () => {
  console.log("game ended", props.gameEnded);
  if (props.gameEnded) {
    return;
  }
  props.restoreMarks();
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.modelValue"
      id="bingo-modal-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      @click="onBackdropClick"
    >
      <div
        class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl relative"
      >
        <!-- Close button -->
        <button
          class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
          @click="close"
        >
          ✕
        </button>

        <!-- Title -->
        <h2 v-if="props.title" class="text-xl font-bold mb-4 text-gray-900">
          {{ props.title }}
        </h2>
        <UButton
          class="text-sm font-bold mb-4 text-gray-900"
          color="secondary"
          size="sm"
          @click="handleRestoreMarks"
        >
          Mark All Cards
        </UButton>

        <!-- Numbers list -->
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(num, idx) in props.numbers"
            :key="`bingo-modal-${num}-${idx}`"
            class="h-10 aspect-square flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-base md:text-lg shadow-md select-none"
          >
            {{ num }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
