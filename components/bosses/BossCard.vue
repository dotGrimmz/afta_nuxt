<template>
  <div
    class="relative group overflow-hidden rounded-2xl shadow-xl aspect-[4/5]"
  >
    <!-- Diagonal Slice -->
    <a
      v-if="boss.siteUrl"
      :href="boss.siteUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="absolute inset-0 z-0 bg-black cursor-pointer block"
    >
      <img
        :style="{ objectPosition: boss.objectPosition || 'center' }"
        class="object-cover object-top w-full h-full transform scale-125"
        :src="boss.avatarUrl"
      />
    </a>

    <!-- Otherwise, render original block -->
    <div v-else class="absolute inset-0 z-0 bg-black">
      <img
        :style="{ objectPosition: boss.objectPosition || 'center' }"
        class="object-cover object-top w-full h-full transform scale-125"
        :src="boss.avatarUrl"
      />
    </div>

    <!-- Medal Badge -->
    <div
      class="absolute top-4 left-4 z-10 text-3xl flex items-center space-x-2"
      :class="{
        'text-yellow-400': boss.rank === 1,
        'text-gray-400': boss.rank === 2,
        'text-orange-600': boss.rank === 3,
        'text-red-600': boss.rank === 4,
      }"
    >
      <span>{{ medalIcon }}</span>
      <span
        v-if="boss.rank === 4"
        class="text-sm font-semibold uppercase tracking-wide"
      >
        NEW MODERATOR
      </span>
    </div>

    <!-- Name -->
    <div class="absolute bottom-4 left-4 z-10 text-white text-lg font-bold">
      {{ boss.name }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  boss: {
    type: Object,
    required: true,
  },
  defaultBg: {
    type: String,
    default: "/images/default-boss-bg.jpg",
  },
});

const medalIcon = computed(() => {
  switch (props.boss.rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    case 4:
      return "🛡️";
  }
});
</script>

<style scoped>
.clip-diagonal {
  clip-path: polygon(0 0, 10% 0, 20% 100%, 0% 100%);
}
/* .clip-diagonal-reverse {
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
} */

.clip-small-diagonal {
  clip-path: polygon(
    80% 0,
    /* Start diagonal cut at 80% from left at top */ 100% 0,
    /* Top-right corner */ 100% 100%,
    /* Bottom-right corner */ 90% 100%
      /* End diagonal cut at 90% from left at bottom */
  );
}
</style>
