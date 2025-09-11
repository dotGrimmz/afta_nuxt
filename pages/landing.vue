<template>
  <div class="w-full h-full">
    <Lightning
      :hue="230"
      :x-offset="0"
      :speed="1"
      :intensity="1"
      :size="1"
      class="w-full h-full"
    />
  </div>
</template>

<script setup lang="ts">
import Lightning from "~/components/vue-bits/Backgrounds/LetterGlitch/LetterGlitch.vue";
import Galaxy from "~/components/vue-bits/Backgrounds/Galaxy/Galaxy.vue";
</script>
