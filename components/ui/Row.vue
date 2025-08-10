<template>
  <!-- Always a 12-col grid; change if you truly need other counts -->
  <div class="grid grid-cols-12 gap-4">
    <slot />
  </div>
</template>

<script setup lang="ts">
// no props needed unless you really want variable cols
</script>
