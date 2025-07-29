<template>
  <section class="relative w-full overflow-hidden text-white" :class="[height]">
    <!-- Hyperspeed animation background -->
    <HyperspeedBackground />
    <p>Why isnt this working?</p>
    <!-- Overlay (optional darkening) -->
    <!-- <div
      class="absolute inset-0 z-10"
      :class="{
        'bg-black/50': darken,
        'bg-gradient-to-b from-black/50 to-transparent': !darken,
      }"
    ></div> -->

    <!-- Content wrapper -->
  </section>
</template>

<script setup lang="ts">
import HyperspeedBackground from "~/components/vue-bits/Hyperspeed.vue"; // Adjust path if needed

defineProps({
  height: {
    type: String,
    default: "h-[75vh]", // You can customize this
  },
  darken: {
    type: Boolean,
    default: false,
  },
});
</script>
