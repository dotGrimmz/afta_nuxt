<template>
  <div
    v-if="visible"
    class="fixed inset-0 flex items-center justify-center z-[9999] overflow-hidden"
  >
    <!-- Dark overlay -->
    <div class="absolute inset-0 bg-black/70 z-10"></div>

    <!-- BINGO text split into spans -->
    <div
      ref="bingoText"
      class="relative z-30 flex gap-6 text-[18vw] font-black uppercase tracking-widest text-yellow-300 drop-shadow-[0_0_15px_rgba(255,215,0,0.9)] [-webkit-text-stroke:4px_black]"
    >
      <span>B</span>
      <span>I</span>
      <span>N</span>
      <span>G</span>
      <span>O</span>
    </div>

    <!-- Diamonds layer -->
    <div
      ref="diamondLayer"
      class="absolute inset-0 pointer-events-none z-20"
    ></div>
    <!-- Continue button -->
    <button
      ref="continueBtn"
      @click="handleReturn"
      class="absolute bottom-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg opacity-0 z-50"
    >
      Continue
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { gsap } from "gsap";
const { profile } = useProfile();
const router = useRouter();

const props = defineProps<{ visible: boolean }>();

const bingoText = ref<HTMLElement | null>(null);
const diamondLayer = ref<HTMLElement | null>(null);
const continueBtn = ref<HTMLElement | null>(null);

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await nextTick();
      animateWin();
    }
  }
);

const animateWin = () => {
  if (!bingoText.value) return;

  const letters = bingoText.value.querySelectorAll("span");

  // Run one of the animations at random
  animateLettersRandom(letters);

  // Glow pulse (applies to whole word after it appears)
  gsap.to(bingoText.value, {
    filter: "drop-shadow(0 0 60px rgba(255,215,0,1))",
    repeat: -1,
    yoyo: true,
    duration: 1.5,
    ease: "sine.inOut",
    delay: 1.5,
  });

  // Diamonds rain
  for (let i = 0; i < 40; i++) {
    spawnDiamond();
  }

  if (continueBtn.value) {
    gsap.to(continueBtn.value, {
      opacity: 1,
      duration: 1,
      delay: 3,
      ease: "power2.out",
    });
  }
};

/**
 * Pick a random animation style for letters
 */
const animateLettersRandom = (letters: NodeListOf<Element>) => {
  const animations = [
    // Option 1: Staggered Pop + Bounce
    () =>
      gsap.fromTo(
        letters,
        { opacity: 0, y: -150, scale: 0.3 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "bounce.out",
          stagger: 0.15,
        }
      ),

    // Option 2: Wave In
    () =>
      gsap.fromTo(
        letters,
        { opacity: 0, y: 200 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "elastic.out(1, 0.6)",
          stagger: 0.1,
        }
      ),

    // Option 3: Explosion → Snap Together
    () =>
      gsap.fromTo(
        letters,
        {
          opacity: 0,
          x: () => gsap.utils.random(-500, 500),
          y: () => gsap.utils.random(-300, 300),
          rotate: () => gsap.utils.random(-180, 180),
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.6)",
          stagger: 0.05,
        }
      ),

    // Option 4: Zoom & Fade Burst
    () =>
      gsap.fromTo(
        letters,
        { opacity: 0, scale: 5 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "back.out(2)",
          stagger: 0.1,
        }
      ),
  ];

  // Pick one at random
  const pick = gsap.utils.random(animations);
  pick();
};

/**
 * Diamonds falling + piling
 */
const spawnDiamond = () => {
  if (!diamondLayer.value) return;

  const diamond = document.createElement("div");
  diamond.innerHTML = "💎"; // replace with SVG later
  diamond.className = "absolute text-5xl";
  diamond.style.left = `${Math.random() * 100}%`; // random horizontal
  diamond.style.zIndex = String(Math.floor(Math.random() * 30) + 10);
  diamond.style.transform = `scale(${gsap.utils.random(0.9, 1.1)})`;
  diamondLayer.value.appendChild(diamond);

  const h = window.innerHeight;
  const finalY = h - 100 - gsap.utils.random(0, 50); // variation in pile height

  gsap.fromTo(
    diamond,
    { y: -100, opacity: 1, rotate: 0 },
    {
      y: finalY,
      opacity: 1,
      rotate: gsap.utils.random(-45, 45),
      duration: gsap.utils.random(2.5, 4),
      delay: Math.random() * 2,
      ease: "bounce.out",
      onComplete: () => {
        // subtle settle animation
        gsap.to(diamond, {
          y: finalY + gsap.utils.random(5, 15),
          duration: 0.5,
          ease: "power1.inOut",
        });
      },
    }
  );
};

// Button redirect
const handleReturn = () => {
  if (profile.value) {
    router.push("/dashboard/bingo");
  } else {
    router.push("/bingo/play");
  }
};
</script>
