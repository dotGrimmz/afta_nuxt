<template>
  <!-- Full-bleed background -->
  <div class="min-h-screen bg-neutral-900">
    <!-- Centered mobile-sized column only on md+ -->
    <div
      class="min-h-screen mx-auto md:max-w-[430px] md:shadow-2xl md:rounded-2xl md:bg-white md:overflow-hidden"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// Optional: if you want safe-area support, keep it mobile-only
useHead({
  meta: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
  ],
});
</script>

<style>
/* Only apply safe-area padding on small screens */
@supports (padding: env(safe-area-inset-top)) {
  @media (max-width: 480px) {
    :root {
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
    }
  }
}
</style>
