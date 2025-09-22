<template>
  <div
    ref="containerRef"
    class="flex w-full flex-nowrap items-center gap-3 sm:gap-4 overflow-hidden justify-center px-2"
  >
    <div
      v-for="ball in ballItems"
      :key="ball.id"
      class="mt-2 mb-2 flex shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-900 font-semibold select-none transition-shadow duration-200 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 shadow-[0_8px_18px_rgba(16,185,129,0.25)]"
      :class="{
        'ring-2 ring-emerald-200/80 shadow-[0_0_20px_rgba(16,185,129,0.55)]':
          highlightBallId === ball.id,
      }"
      data-ball
    >
      <span class="text-base sm:text-lg md:text-xl">{{ ball.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import gsap from "gsap";

type Ball = {
  id: number;
  value: number;
};

const props = defineProps<{
  numbers: number[];
  disableInitialAnimation?: boolean;
}>();

const containerRef = ref<HTMLElement | null>(null);
const ballItems = ref<Ball[]>([]);
const highlightBallId = ref<number | null>(null);
const isAnimating = ref(false);

let gsapCtx: gsap.Context | null = null;
let highlightTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingChange = false;
let uid = 0;

const newestSix = computed(() => props.numbers.slice(-6).reverse());
const disableInitialAnimation = computed(
  () => props.disableInitialAnimation ?? false
);

const createBall = (value: number): Ball => ({
  id: ++uid,
  value,
});

const clearHighlightTimeout = () => {
  if (highlightTimeout) {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
  }
};

const setHighlight = (id: number | null, duration = 900) => {
  clearHighlightTimeout();
  highlightBallId.value = id;
  if (id === null) return;
  highlightTimeout = setTimeout(() => {
    highlightBallId.value = null;
    highlightTimeout = null;
  }, duration);
};

const applyImmediateState = (values: number[]) => {
  ballItems.value = values.map((value) => createBall(value));
  if (values.length) {
    setHighlight(
      ballItems.value[0].id,
      disableInitialAnimation.value ? 0 : 1100
    );
  } else {
    setHighlight(null);
  }
};

const runInitialRenderAnimation = async () => {
  if (disableInitialAnimation.value) return;
  await nextTick();
  if (!gsapCtx || !containerRef.value) return;

  const nodes = Array.from(
    containerRef.value.querySelectorAll<HTMLElement>("[data-ball]")
  );
  if (!nodes.length) return;

  gsapCtx.add(() => {
    gsap.from(nodes, {
      x: -32,
      opacity: 0,
      duration: 0.45,
      ease: "power1.out",
      stagger: 0.05,
    });
  });
};

const handleNumbersChange = async () => {
  const targetValues = newestSix.value;
  const currentValues = ballItems.value.map((ball) => ball.value);

  if (!currentValues.length) {
    applyImmediateState(targetValues);
    await runInitialRenderAnimation();
    return;
  }

  if (!targetValues.length) {
    ballItems.value = [];
    setHighlight(null);
    return;
  }

  if (
    targetValues.length !== currentValues.length ||
    targetValues.some((value, idx) => value !== currentValues[idx])
  ) {
    const newValues = targetValues.filter(
      (value) => !currentValues.includes(value)
    );

    if (newValues.length !== 1) {
      applyImmediateState(targetValues);
      return;
    }

    const newValue = newValues[0];
    const existingMap = new Map<number, Ball>(
      ballItems.value.map((ball) => [ball.value, ball])
    );
    const newBall = createBall(newValue);

    isAnimating.value = true;
    ballItems.value = [newBall, ...ballItems.value];

    await nextTick();

    if (!gsapCtx || !containerRef.value) {
      applyImmediateState(targetValues);
      isAnimating.value = false;
      return;
    }

    const nodes = Array.from(
      containerRef.value.querySelectorAll<HTMLElement>("[data-ball]")
    );
    const newNode = nodes[0];
    const others = nodes.slice(1, Math.min(nodes.length, 6));
    const overflowNode = nodes.length > 6 ? nodes[nodes.length - 1] : null;

    await new Promise<void>((resolve) => {
      gsapCtx!.add(() => {
        const tl = gsap.timeline({
          defaults: { ease: "power1.out", duration: 0.45 },
          onComplete: resolve,
        });

        tl.fromTo(newNode, { x: -48, opacity: 0 }, { x: 0, opacity: 1 });

        if (others.length) {
          tl.from(others, { x: 20, duration: 0.45, stagger: 0.04 }, "<");
        }

        if (overflowNode) {
          tl.to(
            overflowNode,
            { x: 48, opacity: 0, duration: 0.4, ease: "power1.in" },
            "<"
          );
        }

        tl.to(
          newNode,
          {
            scale: 1.08,
            duration: 0.18,
            ease: "power1.out",
            yoyo: true,
            repeat: 1,
          },
          "-=0.18"
        );
      });
    });

    const nextBalls = targetValues.map((value) => {
      if (value === newValue) return newBall;
      const existing = existingMap.get(value);
      return existing ?? createBall(value);
    });

    ballItems.value = nextBalls;
    setHighlight(newBall.id, 1100);
    isAnimating.value = false;

    if (pendingChange) {
      pendingChange = false;
      await handleNumbersChange();
    }

    return;
  }
};

watch(
  () => props.numbers.slice(),
  async () => {
    if (isAnimating.value) {
      pendingChange = true;
      return;
    }
    await handleNumbersChange();
  },
  { immediate: true }
);

onMounted(() => {
  gsapCtx = gsap.context(() => {}, containerRef);
});

onBeforeUnmount(() => {
  gsapCtx?.revert();
  gsapCtx = null;
  clearHighlightTimeout();
});
</script>
