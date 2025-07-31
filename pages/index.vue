<template>
  <div>
    <section class="relative w-full h-[30vh]">
      <Hyperspeed />
      <div
        class="top-0 left-0 z-1 absolute flex flex-col justify-center items-center w-full h-full pointer-events-none bg-clip-text text-transparent"
      >
        <p
          class="mt-4 max-w-[18ch] font-bold text-[clamp(2rem,4vw,2.6rem)] text-white text-center leading-[1.2] tracking-[-2px]"
          :style="{
            backgroundImage:
              'linear-gradient(135deg, #0f0f1f, #331d2c, #6f1a07)',

            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 16px rgba(0, 0, 0, 0.5)',
            filter: 'drop-shadow(0 0 6px #00ffff)',
          }"
        >
          AFTA
        </p>
      </div>
    </section>

    <div class="flex flex-col gap-4 bg-black p-4 min-h-screen">
      <PollsPollSection />
      <BossSection />
      <EventsSection />
    </div>
  </div>
</template>

<style scoped>
.landing {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
}
</style>

<script setup>
import Hyperspeed from "~/components/vue-bits/Hyperspeed.vue";
import BossSection from "~/components/bosses/BossSection.vue";
import EventsSection from "~/components/events/EventsSection.vue";
</script>
