<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  className?: string;
}>();

// clamp 1..12
const span = (n?: number) => {
  if (!n) return null;
  const v = Math.min(12, Math.max(1, n));
  // explicit, non-dynamic strings so Tailwind always generates them
  return [
    null,
    "col-span-1",
    "col-span-2",
    "col-span-3",
    "col-span-4",
    "col-span-5",
    "col-span-6",
    "col-span-7",
    "col-span-8",
    "col-span-9",
    "col-span-10",
    "col-span-11",
    "col-span-12",
  ][v];
};

const classes = computed(() => [
  span(props.xs) ?? "col-span-12",
  props.sm ? `sm:${span(props.sm)}` : "",
  props.md ? `md:${span(props.md)}` : "",
  props.lg ? `lg:${span(props.lg)}` : "",
  props.xl ? `xl:${span(props.xl)}` : "",
  props.className ?? "",
]);
</script>
