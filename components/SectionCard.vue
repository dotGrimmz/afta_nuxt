<template>
  <div
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter.space.prevent="handleClick"
    class="section-card"
  >
    <!-- ─── image overlay (optional) ──────────────────────────── -->
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="imageAlt"
      class="absolute inset-0 h-full w-full rounded-[inherit] z-0"
      :style="`object-fit: ${objectFit}; object-position: ${objectPosition};`"
    />
    <!-- darken / blur overlay if desired -->
    <div
      v-if="imageUrl && darken"
      class="absolute inset-0 bg-black"
      :style="{ opacity: darkenOpacity }"
    />

    <!-- ─── card content ─────────────────────────────────────── -->
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  imageUrl: { type: String, default: "" },
  imageAlt: { type: String, default: "" },
  onClick: { type: Function, default: null },
  darken: { type: Boolean, default: false },
  darkenOpacity: { type: Number, default: 0.4 },
  objectPosition: { type: String, default: "center" }, // 👈 NEW
  objectFit: { type: String, default: "cover" }, // 👈 NEW
});

function handleClick(e: MouseEvent | KeyboardEvent) {
  props.onClick?.(e);
}
</script>

<style scoped>
/* base card styles */
.section-card {
  position: relative;
  padding: 1.5rem; /* p-6          */
  border-radius: 0.5rem; /* rounded-lg   */
  background-color: white;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.2s, transform 0.2s;
  outline: none;
  color: white;
}

/* keyboard focus ring */
.section-card:focus {
  box-shadow: 0 0 0 4px #2563eb; /* blue-600 ring */
}

/* tap / active outline */
.section-card:active {
  outline: 2px solid #2563eb;
}

/* slight hover / focus scale (desktop) */
@media (hover: hover) {
  .section-card:hover {
    transform: scale(1.02);
  }
}
</style>
