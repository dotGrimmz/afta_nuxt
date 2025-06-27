<template>
  <section
    class="relative w-full overflow-hidden bg-cover text-white"
    :class="[height]"
    :style="{
      backgroundImage: `url(${imageUrl})`,
      backgroundAttachment: isMobile ? 'scroll' : 'fixed',
      backgroundPosition: 'center 80%',
    }"
  >
    <!-- Overlay (optional darkening) -->
    <div
      class="absolute inset-0"
      :class="{
        'bg-black/50': darken,
        'bg-gradient-to-b from-black/50 to-transparent': !darken,
      }"
    ></div>

    <!-- Content wrapper -->
    <div
      class="relative z-10 flex items-center justify-center h-full px-6 text-center"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  height: {
    type: String,
    default: "h-[75vh]", // Customizable height
  },
  darken: {
    type: Boolean,
    default: false,
  },
});

const { isMobile } = useIsMobile();
</script>
