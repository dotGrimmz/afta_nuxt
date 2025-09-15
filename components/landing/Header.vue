<template>
  <header
    :class="[
      'fixed top-0 left-0 w-full z-50 transition-colors duration-300',
      isScrolled
        ? 'bg-black/90 backdrop-blur-md'
        : 'bg-black/30 backdrop-blur-sm',
    ]"
    style="--header-height: 64px"
  >
    <!-- Overlay layer -->
    <div
      :class="[
        'absolute inset-0 -z-10 transition-colors duration-300',
        isScrolled
          ? 'bg-black/90 backdrop-blur-md'
          : 'bg-black/30 backdrop-blur-sm',
      ]"
    ></div>

    <!-- Header content -->
    <div class="h-[64px] flex items-center justify-end px-6 relative z-10">
      <button
        :class="[
          'px-5 py-2 rounded-lg font-semibold transition-colors duration-300',
          isScrolled
            ? 'bg-green-500 text-black hover:bg-green-400'
            : 'bg-white/20 text-white hover:bg-white/30',
        ]"
      >
        Login
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const isScrolled = ref(false);

const handleScroll = (): void => {
  isScrolled.value = window.scrollY > 80;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>
