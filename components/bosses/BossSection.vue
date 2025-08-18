<script setup>
import BossCard from "./BossCard.vue";
import AnimatedList from "../vue-bits/AnimatedList.vue";
import CurvedLoop from "../vue-bits/TextAnimations/CurvedLoop/CurvedLoop.vue";

const bosses = [
  {
    rank: 1,
    name: "ᴹᶻ🅃ȏ̈χɪᴄ♠️🄻𝖊i𝖌H",
    avatarUrl: "/images/bosses/Leigh.jpg",
  },
  {
    rank: 2,
    name: "🐰ℬ𝓊𝓃𝓃𝓎㊙️",
    avatarUrl: "/images/bosses/hunny_coffee.jpg",
    // objectPosition: "50% -60%",
  },

  {
    rank: 3,
    name: "🤘🏾⚜️♛ȺƑའįҠȺហɖơƖƖ⚜️💰📺💰",
    avatarUrl: "/images/bosses/a_doll.jpg",
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
