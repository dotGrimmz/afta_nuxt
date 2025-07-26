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
        <BaseButton size="lg"
          >⚠️Keep in mind this is not PRODUCTION READY⚠️</BaseButton
        >
      </div>
    </ParallaxHero>
    <div class="flex flex-col gap-4 bg-black p-4 min-h-screen">
      <PollsPollSection />
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
