<script setup lang="ts">
import { provide, ref } from "vue";
import type { Poll } from "~/types/poll";

interface PollApiResponse {
  poll: Poll[];
}

const { data: activePolls } = await useFetch<PollApiResponse[]>(
  "/api/polls/active"
);

const activePoll = activePolls.value?.poll?.[0] as Poll;
console.log(activePolls.value?.poll?.[0]);
</script>
<template>
  <div>
    <ParallaxHero
      imageUrl="/images/grimmz.jpg"
      height="h-[30vh] md:h-[50vh]"
      :darken="false"
    >
      <div>
        <h1 class="text-4xl md:text-6xl font-extrabold mb-4">
          Welcome to AFTA
        </h1>
        <p class="text-lg md:text-2xl text-white/80 mb-6">
          Another Failed Tagged App, but bold.
        </p>
        <BaseButton size="lg">Get Started</BaseButton>
      </div>
    </ParallaxHero>
    <div class="landing">
      <PollsPollSection v-if="activePoll" :poll="activePoll" />
    </div>
  </div>
</template>

<style scoped>
.landing {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: black;
  padding: 1rem;
}
</style>
