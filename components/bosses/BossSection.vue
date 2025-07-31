<script setup></script>

<template>
  <UCollapsible v-model:open="open">
    <!-- Main card -->

    <SectionCard
      imageUrl="/images/bosses_7_29.png"
      objectFit="cover"
      objectPosition="center"
      class="h-[190px]"
    >
      <h2 class="text-2xl font-bold mb-1">Bosses of the Week</h2>
    </SectionCard>
    <template #content>
      <h2 class="text-center">🚧Under Construction!🚧</h2>
    </template>
  </UCollapsible>
</template>
