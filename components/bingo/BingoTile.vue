<template>
  <button
    type="button"
    class="group relative w-full aspect-square grid place-items-center rounded-xl border bg-zinc-900 text-zinc-100 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
    :class="[
      // marked or FREE
      marked || isFree
        ? 'border-emerald-500 bg-emerald-600/15'
        : 'border-white/10 hover:border-white/30 hover:bg-white/5 active:scale-[.98]',
      // pulse only when number is drawn but not marked
      canPulse ? 'border-emerald-500 animate-pulse-soft' : '',
      // FREE tile accent
      isFree
        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-400/40 animate-glow-free'
        : '',
    ]"
    :aria-pressed="marked || isFree"
    :disabled="marked || isFree"
    @click="onMark"
    @keydown.enter.prevent="onMark"
    @keydown.space.prevent="onMark"
  >
    <span
      class="font-semibold select-none text-base sm:text-lg md:text-xl lg:text-2xl tracking-wide"
      :class="isFree ? 'uppercase' : ''"
    >
      {{ isFree ? "FREE" : value }}
    </span>

    <!-- subtle check in corner when marked -->
    <span
      v-if="marked && !isFree"
      class="absolute bottom-1 right-1 text-[10px] sm:text-xs text-emerald-300/90"
    >
      ✓
    </span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number | null;
    marked: boolean; // true = explicitly marked (click or restored)
    shouldPulse: boolean; // true = number was drawn
    isFree?: boolean;
  }>(),
  { isFree: false }
);

const emit = defineEmits<{ (e: "mark"): void }>();

// Pulse only if drawn AND not marked AND not free
const canPulse = computed(
  () => props.shouldPulse && !props.marked && !props.isFree
);

const onMark = () => {
  if (props.marked || props.isFree) return;
  emit("mark");
};
</script>
