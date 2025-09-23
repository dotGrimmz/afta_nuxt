<template>
  <div
    class="relative min-h-screen w-full overflow-x-hidden bg-black text-white"
  >
    <header
      class="fixed left-0 right-0 top-0 z-30 flex items-center justify-end px-8 py-4 text-sm uppercase tracking-wide transition-opacity duration-500"
      :class="[
        isNavVisible
          ? 'backdrop-blur-md opacity-100'
          : 'pointer-events-none opacity-0',
      ]"
    >
      <NuxtLink
        to="/login"
        class="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold transition-colors hover:border-cyan-400 hover:bg-cyan-400/20"
      >
        Login
      </NuxtLink>
    </header>

    <main class="relative z-10">
      <section
        id="hero"
        class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center"
      >
        <div class="absolute inset-0 -z-10">
          <LightRays
            class="!h-full !w-full"
            class-name="-z-10"
            rays-origin="top-center"
            rays-color="#00ffff"
            :rays-speed="1.2"
            :light-spread="2"
            :ray-length="3"
            :follow-mouse="false"
            :noise-amount="0.1"
            :distortion="0.2"
          />
        </div>

        <div class="relative z-10 flex max-w-3xl flex-col items-center">
          <p class="text-base uppercase tracking-[0.4em] text-cyan-300/70">
            Welcome to AFTA
          </p>
          <h1 class="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Explore the future galaxy of collaborative trading and analytics.
          </h1>
          <p class="mt-6 text-lg text-white/80 md:text-xl">
            Scroll to discover how our community leverages real-time insights
            and smart automation to stay ahead of the market.
          </p>
          <NuxtLink
            to="#features"
            class="mt-10 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold uppercase tracking-widest transition-colors hover:border-cyan-400 hover:bg-cyan-400/20"
          >
            Learn More
          </NuxtLink>
        </div>
      </section>

      <section
        id="bosses"
        ref="bossesSectionRef"
        class="relative z-20 px-6 pb-24 pt-16 text-center"
      >
        <p class="text-sm uppercase tracking-[0.5em] text-cyan-200/80">
          Bosses of the Week
        </p>
        <h2 class="mt-4 text-3xl font-semibold md:text-4xl">
          Recognizing this week’s top supporters
        </h2>
        <p class="mt-4 mx-auto max-w-2xl text-base text-white/70">
          Honoring the members pushing AFTA forward. Your guidance, energy, and
          consistency keep the desk sharp.
        </p>

        <div
          class="mt-16 flex flex-col items-center gap-10 md:flex-row md:items-end md:justify-center"
        >
          <div
            v-for="supporter in supporters"
            :key="supporter.name"
            class="relative flex flex-col items-center text-center"
          >
            <div
              class="relative flex items-center justify-center"
              :class="supporter.wrapperClass"
            >
              <span
                class="absolute inset-0 -z-10 rounded-full blur-2xl transition-all duration-700 ease-out"
                :class="supporter.auraClass"
                :style="{
                  transform: bossesVisible
                    ? 'scale(1)'
                    : supporter.initialAuraScale,
                  opacity: bossesVisible ? '1' : '0',
                  transitionDelay: bossesVisible
                    ? supporter.delay + 'ms'
                    : '0ms',
                }"
              />

              <img
                :src="supporter.image"
                :alt="supporter.name"
                class="rounded-full object-cover shadow-2xl ring-4 ring-white/20 transition-all duration-700 ease-out"
                :class="supporter.imageClass"
                :style="{
                  opacity: bossesVisible ? '1' : '0',
                  transform: bossesVisible
                    ? 'translateY(0) scale(1)'
                    : 'translateY(40px) scale(0.85)',
                  transitionDelay: bossesVisible
                    ? supporter.delay + 'ms'
                    : '0ms',
                }"
              />
            </div>
            <div
              class="mt-6 space-y-1 transition-opacity duration-700"
              :style="{
                opacity: bossesVisible ? '1' : '0',
                transitionDelay: bossesVisible
                  ? supporter.delay + 150 + 'ms'
                  : '0ms',
              }"
            >
              <p class="text-sm uppercase tracking-[0.3em] text-white/60">
                {{ supporter.title }}
              </p>
              <h3 class="text-xl font-semibold">{{ supporter.name }}</h3>
              <p class="text-sm text-white/60">{{ supporter.note }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="min-h-screen px-6 py-24">
        <!--    <div
          class="mx-auto flex max-w-5xl flex-col gap-12 md:grid md:grid-cols-2"
        >
          <article class="space-y-4">
            <h2 class="text-3xl font-semibold">Modular Insights</h2>
            <p class="text-white/80">
              Plug into a library of AI-assisted trading strategies, customize
              them, and deploy with confidence. Our dashboards keep you focused
              on the signals that matter most.
            </p>
          </article>
          <article class="space-y-4">
            <h2 class="text-3xl font-semibold">Realtime Collaboration</h2>
            <p class="text-white/80">
              Invite teammates, rehearse different market scenarios, and share
              findings instantly. Coordinate moves across desks regardless of
              where you trade from.
            </p>
          </article>
        </div>-->
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";

import LightRays from "~/components/vue-bits/Backgrounds/LightRays/LightRays.vue";

const isNavVisible = ref(false);
const NAV_TRIGGER_Y = 160;

const supporters = [
  {
    name: "Leigh Anderson",
    image: "/images/bosses/Leigh.jpg",
    title: "3rd Place",
    note: "Daily liquidity drops and late-session guidance.",
    auraClass:
      "bg-gradient-to-b from-orange-200/70 via-amber-400/60 to-orange-500/40",
    wrapperClass: "md:translate-y-10",
    imageClass: "h-36 w-36 md:h-44 md:w-44",
    delay: 0,
    initialAuraScale: "scale(0.5)",
  },
  {
    name: "Hunny Coffee",
    image: "/images/bosses/hunny_coffee.jpg",
    title: "Top Boss",
    note: "Strategic calls and community stewardship all week.",
    auraClass:
      "bg-gradient-to-b from-yellow-200/80 via-amber-300/70 to-yellow-500/50",
    wrapperClass: "md:-mt-6",
    imageClass: "h-44 w-44 md:h-56 md:w-56",
    delay: 240,
    initialAuraScale: "scale(0.4)",
  },
  {
    name: "Savage",
    image: "/images/bosses/savage.jpg",
    title: "2nd Place",
    note: "Consistent insights and weekend prep sessions.",
    auraClass:
      "bg-gradient-to-b from-slate-100/70 via-slate-400/60 to-slate-600/40",
    wrapperClass: "md:translate-y-6",
    imageClass: "h-40 w-40 md:h-48 md:w-48",
    delay: 120,
    initialAuraScale: "scale(0.45)",
  },
] as const;

const bossesSectionRef = ref<HTMLElement | null>(null);
const bossesVisible = ref(false);
let bossesObserver: IntersectionObserver | null = null;

const handleScroll = () => {
  if (typeof window === "undefined") return;
  isNavVisible.value = window.scrollY > NAV_TRIGGER_Y;
};

onMounted(() => {
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);

  if (bossesObserver) {
    bossesObserver.disconnect();
    bossesObserver = null;
  }
});

const route = useRoute();

// Ensure hash navigation works on direct loads when sections exist.
onMounted(() => {
  if (route.hash) {
    const target = document.querySelector(route.hash);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }
});

onMounted(() => {
  if (typeof window === "undefined") return;

  if (!("IntersectionObserver" in window)) {
    bossesVisible.value = true;
    return;
  }

  if (!bossesSectionRef.value) return;

  bossesObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting) {
        bossesVisible.value = true;
        bossesObserver?.disconnect();
        bossesObserver = null;
      }
    },
    {
      threshold: 0.35,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  bossesObserver.observe(bossesSectionRef.value);
});
</script>
