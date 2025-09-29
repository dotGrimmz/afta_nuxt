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
        class="relative pt-4 pb-6 flex fit-content justify-center overflow-hidden px-6 text-center"
      >
        <div class="absolute inset-0 -z-10">
          <DarkVeil
            :hue-shift="58"
            :noise-intensity="0"
            :scanline-intensity="0"
            :speed="2.5"
            :scanline-frequency="0"
            :warp-amount="0"
            :resolution-scale="1"
          />
        </div>

        <div
          class="relative z-10 flex max-w-3xl flex-col justify-center items-center"
        >
          <NuxtImg src="/images/logo/afta-logo-2.png" alt="afta-logo" />
          <!-- <NuxtImg
            :width="480"
            :height="120"
            alt="grim-logo"
            src="/images/logo/grim-logo.png"
            class="mt-6 w-72 h-20 rounded border-2 border-[#05DF72] bg-white/10 ring-2 ring-white/20 object-contain shadow-lg"
          /> -->
        </div>
      </section>

      <section
        id="bosses"
        ref="bossesSectionRef"
        class="relative z-20 px-6 pt-16 text-center"
      >
        <div class="absolute inset-0 -z-10">
          <Galaxy :hue-shift="330" :saturation="1" :glow-intensity="0.45" />
        </div>
        <p class="text-sm uppercase tracking-[0.5em] text-cyan-200/80">
          Bosses of the Week
        </p>
        <h2 class="mt-4 text-3xl font-semibold md:text-4xl">
          Recognizing this week’s top supporters
        </h2>

        <div
          class="mt-16 flex flex-col items-center gap-10 md:flex-row md:items-end md:justify-center"
        >
          <div
            v-for="supporter in supporters"
            :key="supporter.name"
            class="relative flex flex-col items-center text-center"
            :class="supporter.orderClass"
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
        <InfiniteScroll
          :items="items"
          width="30rem"
          max-height="50rem"
          :item-min-height="300"
          :is-tilted="true"
          tilt-direction="left"
          :autoplay="true"
          :autoplay-speed="0.5"
          autoplay-direction="down"
          :pause-on-hover="false"
        />
        <div
          class="mt-10 flex flex-col items-center gap-3 text-xs uppercase tracking-[0.25em] h-[200px] text-white/60 md:flex-row md:justify-center md:gap-6 md:text-sm"
        >
          <span>© {{ trademarkYear }} AFTA LTD. TRADEMARK</span>
          <span
            class="hidden h-3 w-px bg-white/30 md:inline-block"
            aria-hidden="true"
          />
          <span>Powered by dotGrimmz</span>
          <span
            class="hidden h-3 w-px bg-white/30 md:inline-block"
            aria-hidden="true"
          />
          <a
            href="mailto:rakeemxng@gmail.com"
            class="text-cyan-300 transition-colors hover:text-cyan-100"
          >
            Contact Me
          </a>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import Galaxy from "~/components/vue-bits/Backgrounds/Galaxy/Galaxy.vue";
import DarkVeil from "~/components/vue-bits/Backgrounds/DarkVeil/DarkVeil.vue";
import InfiniteScroll from "~/components/vue-bits/Components/InfiniteScroll/InfiniteScroll.vue";

const isNavVisible = ref(false);
const NAV_TRIGGER_Y = 160;
const bossStyles = {
  bronze:
    "bg-gradient-to-b from-orange-200/70 via-amber-400/60 to-orange-500/40",
  silver: "bg-gradient-to-b from-slate-100/70 via-slate-400/60 to-slate-600/40",
  gold: "bg-gradient-to-b from-yellow-200/80 via-amber-300/70 to-yellow-500/50",
};

const supporters = [
  {
    name: "♏️ᴹᶻ🅃ȏ̈χɪᴄ🄻𝖊i𝖌H😈",
    image: "/images/bosses/Leigh.jpg",
    title: "Top Boss",
    note: "Twin n EM! Bingo Boss",
    auraClass: bossStyles.gold,
    wrapperClass: "md:translate-y-10",
    imageClass: "h-36 w-36 md:h-44 md:w-44",
    orderClass: "md:order-1",
    delay: 240,
    initialAuraScale: "scale(0.5)",
  },

  {
    name: " Lynn 🫀♍️",
    image: "/images/bosses/lynn_tagged.jpg",
    title: "Biggest Boss",
    note: "Newest Moderator!",
    auraClass: bossStyles.silver,

    wrapperClass: "md:translate-y-6",
    imageClass: "h-40 w-40 md:h-48 md:w-48",
    orderClass: "md:order-2",
    delay: 120,
    initialAuraScale: "scale(0.45)",
  },
  {
    name: "㊙️ℬ𝓊𝓃𝓃𝓎🐰",
    image: "/images/bosses/hunny_coffee.jpg",
    title: "Big Boss",
    note: "Masta Milk DuD",
    auraClass: bossStyles.bronze,

    wrapperClass: "md:-mt-6",
    imageClass: "h-44 w-44 md:h-56 md:w-56",
    orderClass: "md:order-3",
    delay: 0,
    initialAuraScale: "scale(0.4)",
  },
] as const;

interface ImageItemOptions {
  objectPosition?: string;
}

const createImageItem = (
  src: string,
  alt: string,
  options: ImageItemOptions = {}
) => ({
  content: defineComponent({
    name: "InfiniteScrollImageItem",
    setup() {
      return () =>
        h("img", {
          src,
          alt,
          class:
            "h-full w-full rounded-2xl border border-white/10 object-cover shadow-lg shadow-black/40",
          style: options.objectPosition
            ? { objectPosition: options.objectPosition }
            : undefined,
          loading: "lazy",
        });
    },
  }),
});

const createTextItem = (title: string, body: string) => ({
  content: defineComponent({
    name: "InfiniteScrollTextItem",
    setup() {
      return () =>
        h(
          "div",
          {
            class:
              "flex h-full w-full flex-col justify-center gap-3 rounded-2xl bg-white/5 p-6 text-left",
          },
          [
            h(
              "p",
              { class: "text-sm uppercase tracking-[0.25em] text-cyan-200/80" },
              title
            ),
            h("p", { class: "text-lg font-semibold" }, body),
          ]
        );
    },
  }),
});

const items = [
  createImageItem("/images/flyers/bingo.png", "AFTA bingo night flyer"),
  createImageItem(
    "/images/flyers/church_flyer.png",
    "Animated Grimmz event poster",
    { objectPosition: "left center" }
  ),
  // createTextItem(
  //   "Bossboard",
  //   "Catch the nightly recap from Grimmz and keep your trading prep sharp."
  // ),
  createImageItem("/images/flyers/live_grimmz.png", "New Moderator", {
    objectPosition: "left center",
  }),
  // createTextItem(
  //   "Community Wins",
  //   "Shoutouts to the crew stacking plays and sharing insight in the war room."
  // ),
];

const trademarkYear = new Date().getFullYear();

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
    }
  );

  bossesObserver.observe(bossesSectionRef.value);
});
</script>
