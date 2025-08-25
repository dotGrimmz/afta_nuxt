<script setup>
import BossCard from "./BossCard.vue";
import AnimatedList from "../vue-bits/AnimatedList.vue";
import CurvedLoop from "../vue-bits/TextAnimations/CurvedLoop/CurvedLoop.vue";
import { bosses } from "~/utils/bosses";

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
