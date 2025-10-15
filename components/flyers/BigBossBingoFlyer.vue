<template>
  <div
    class="relative mx-auto aspect-square w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_32px_90px_rgba(0,0,0,0.5)]"
  >
    <NuxtImg
      src="/images/flyers/saints_presentation_schedule.png"
      alt="Saints in a Bowl Presentation Schedule"
      class="absolute inset-0 h-full w-full object-contain bg-black"
      sizes="(max-width: 420px) 100vw, 420px"
    />

    <!-- Avatar -->
    <div :style="avatarStyle">
      <NuxtImg
        src="/images/flyers/cocoma.jpg"
        alt="CocoMa"
        class="h-full w-full rounded-full object-cover border-4 border-amber-400 shadow-xl"
      />
    </div>

    <!-- Badge -->
    <div :style="badgeStyle" class="flex items-center justify-center">
      <span class="text-yellow-300 text-lg font-bold">★</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CSSProperties } from "vue";

//
// 🔧 Editable configuration objects
//
const avatarConfig = {
  size: 80,
  x: "7%",
  y: "35%",
  elevation: 20,
};

const badgeConfig = {
  size: 20, // diameter in pixels
  x: "32%", // horizontal position
  y: "36.8%", // vertical position
  elevation: 15, // distance raised from flyer
  color: "#1e3a8a", // fill (blue tone)
  border: "#facc15", // gold-like border
  glow: "rgba(250, 204, 21, 0.5)", // soft glow for realism
};

//
// 🎨 Computed styles
//
const avatarStyle = computed<CSSProperties>(() => ({
  position: "absolute",
  top: avatarConfig.y,
  left: avatarConfig.x,
  width: `${avatarConfig.size}px`,
  height: `${avatarConfig.size}px`,
  transform: `translateY(-${avatarConfig.elevation}px)`,
  borderRadius: "50%",
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
  transition: "all 0.3s ease",
}));

const badgeStyle = computed<CSSProperties>(() => ({
  position: "absolute",
  top: badgeConfig.y,
  left: badgeConfig.x,
  width: `${badgeConfig.size}px`,
  height: `${badgeConfig.size}px`,
  borderRadius: "50%",
  backgroundColor: badgeConfig.color,
  border: `3px solid ${badgeConfig.border}`,
  transform: `translateY(-${badgeConfig.elevation}px)`,
  boxShadow: `0 0 20px ${badgeConfig.glow}`,
  transition: "all 0.3s ease",
}));
</script>
