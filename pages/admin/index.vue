<template>
  <div>
    <!-- Hyperspeed Background Effect -->
    <section class="relative w-full overflow-hidden text-white">
      <HyperspeedBackground />
    </section>

    <!-- <div
        class="relative z-10 flex flex-col items-center justify-center h-full text-center text-white"
      >
        <h1 class="text-4xl md:text-6xl font-bold text-red-500 drop-shadow-lg">
          Welcome to Neo Highway
        </h1>
        <p class="mt-4 text-lg md:text-xl text-white drop-shadow-md">
          Speed meets style in this neon journey.
        </p>
      </div> -->

    <!-- Parallax Hero on top of Hyperspeed -->
    <!-- <ParallaxHero
      imageUrl="/images/grimmz.jpg"
      height="h-[30vh] md:h-[50vh]"
      :darken="false"
      class="relative z-10"
    >
      <div>
        <h1 class="text-4xl md:text-6xl font-extrabold mb-4">
          Welcome to AFTA
        </h1>
        <p class="text-lg md:text-2xl text-white/80 mb-6">
          Another Failed Tagged App, but bold.
        </p>
        <BaseButton size="lg">
          ⚠️Keep in mind this is not PRODUCTION READY⚠️
        </BaseButton>
      </div>
    </ParallaxHero> -->

    <!-- Main Content -->
    <div
      class="relative z-10 flex flex-col gap-4 bg-black bg-opacity-80 p-4 min-h-screen"
    >
      <PollsPollSection />
    </div>
  </div>
</template>

<script setup lang="ts">
import ParallaxHero from "~/components/ParallaxHero.vue";
import PollsPollSection from "~/components/polls/PollSection.vue";
import HyperspeedBackground from "~/components/vue-bits/Hyperspeed.vue"; // Adjust path if needed
</script>
