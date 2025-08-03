<script setup>
import Threads from "../vue-bits/Threads.vue";
import BossCard from "./BossCard.vue";
import AnimatedList from "../vue-bits/AnimatedList.vue";

const bosses = [
  {
    rank: 1,
    name: "♓🅹𝖚𝖘♠️𝕏𝖙𝖗𝖆 🅷𝖔𝖙🔥",
    avatarUrl: "/images/bosses/extra_white.jpg",
    // objectPosition: "50% -60%",
  },
  {
    rank: 2,
    name: "🍯🐰ℋ𝑜𝓃𝑒𝓎ℬ𝓊𝓃𝓃𝓎",
    avatarUrl: "/images/bosses/hunny_coffee.jpg",
  },

  {
    rank: 4,
    name: "🖤 ʂαʋαɠҽ💕💪🏾",
    avatarUrl: "/images/bosses/savage.jpg",
    objectPosition: "50% 20%",
  },
];
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
      <AnimatedList
        :displayScrollbar="false"
        className="w-[200px]"
        :items="bosses"
      >
        <template #default="{ item: boss }">
          <BossCard :key="boss.rank" :boss="boss" />
        </template>
      </AnimatedList>
    </template>
  </UCollapsible>
</template>
