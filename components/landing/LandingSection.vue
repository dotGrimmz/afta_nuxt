<template>
  <section
    class="w-full flex items-center justify-center bg-black/40 backdrop-blur-sm"
  >
    <div class="w-full max-w-7xl px-6">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
section {
  /* Consistent heights by breakpoints */
  min-height: 20vh; /* default for mobile */
  /* border: 1px solid red; */
  margin-top: 0rem;
  margin-bottom: 0rem;
}

@media (min-width: 768px) {
  section {
    min-height: 20vh;
    border: 1px solid green;
  }
}

@media (min-width: 1280px) {
  section {
    min-height: 10vh;
    border: 1px solid orange;
  }
}

/* Prevent scrollbars on child content */
section,
section > div {
  overflow: hidden;
}
</style>
