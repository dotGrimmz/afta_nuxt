<template>
  <section
    ref="section"
    class="relative isolate h-screen w-full overflow-hidden"
  >
    <!-- Sticky container -->
    <div class="sticky top-0 h-screen w-full">
      <!-- Background Image -->
      <div
        class="absolute inset-0 bg-cover bg-center transition-transform duration-300 will-change-transform"
        :style="{
          backgroundImage: `url(${imageUrl})`,
          transform: `translateY(${bgOffset}px)`,
        }"
      ></div>

      <!-- Overlay (optional) -->
      <div v-if="darken" class="absolute inset-0 bg-black/50 z-10"></div>

      <!-- Foreground content -->
      <div
        class="relative z-20 h-full flex flex-col items-center justify-center text-white text-center px-6"
      >
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  darken: {
    type: Boolean,
    default: false,
  },
  speed: {
    type: Number,
    default: 0.3, // Lower = slower background scroll
  },
});

const bgOffset = ref(0);
const section = ref<HTMLElement | null>(null);

function onScroll() {
  if (!section.value) return;
  const rect = section.value.getBoundingClientRect();
  const scrollAmount = window.innerHeight - rect.top;
  bgOffset.value = scrollAmount * props.speed;
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>
