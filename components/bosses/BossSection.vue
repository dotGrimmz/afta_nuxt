<script setup>
import Threads from "../vue-bits/Threads.vue";
</script>

<template>
  <UCollapsible v-model:open="open">
    <!-- Main card -->

    <SectionCard objectFit="cover" objectPosition="center" class="h-[190px]">
      <h2 class="text-2xl text-black text-purple-300 font-bold mb-1">
        Bosses of the Week
      </h2>

      <Threads
        :color="[1, 1, 12]"
        :amplitude="1"
        :distance="0"
        :enableMouseInteraction="false"
      />
    </SectionCard>
    <template #content>
      <h2 class="text-center">🚧Under Construction!🚧</h2>
    </template>
  </UCollapsible>
</template>
