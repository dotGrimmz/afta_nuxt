<script setup>
import BossCard from "./BossCard.vue";
import AnimatedList from "../vue-bits/AnimatedList.vue";
import CurvedLoop from "../vue-bits/TextAnimations/CurvedLoop/CurvedLoop.vue";

const bosses = [
  {
    rank: 1,
    name: "♓🅹𝖚𝖘♠️𝕏𝖙𝖗𝖆 🅷𝖔𝖙🔥",
    avatarUrl: "/images/bosses/extra_white.jpg",
    // objectPosition: "50% -60%",
  },
  {
    rank: 2,
    name: "ᴹᶻ🅃ȏ̈χɪᴄ♠️🄻𝖊i𝖌H",
    avatarUrl: "/images/overall/leigh_twin.jpg",
  },

  {
    rank: 3,
    name: "🍯🐰ℋ𝑜𝓃𝑒𝓎ℬ𝓊𝓃𝓃𝓎",
    avatarUrl: "/images/bosses/hunny_coffee.jpg",
    objectPosition: "50% 20%",
  },
];

const open = ref(false);
</script>

<template>
  <UCollapsible v-model:open="open">
    <CurvedLoop
      marquee-text="Bosses ✦ Of ✦ The ✦ Week ✦"
      :speed="2"
      :curve-amount="400"
      direction="left"
      :interactive="false"
    />
    <template #content>
      <AnimatedList
        :displayScrollbar="false"
        className="w-full"
        :items="bosses"
      >
        <template #default="{ item: boss }">
          <BossCard :key="boss.rank" :boss="boss" />
        </template>
      </AnimatedList>
    </template>
  </UCollapsible>
</template>
