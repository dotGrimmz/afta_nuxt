<script setup lang="ts">
/* open/closed state */
const open = ref(false);

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <!-- wrapper keeps card + dropdown grouped -->
  <div class="w-full">
    <!-- main card -->
    <SectionCard
      imageUrl="/images/black_sweater.jpg"
      objectFit="cover"
      objectPosition="bottom center"
      :onClick="toggle"
    >
      <h2 class="text-2xl font-bold mb-1">Polls</h2>
      <p class="text-sm leading-relaxed">
        Tap to view polls about AFTA’s features and preferences.
      </p>
    </SectionCard>

    <!-- animated dropdown -->
    <transition name="slide-fade">
      <div
        v-if="open"
        class="dropdown-content rounded-b-lg bg-white text-gray-800 p-4 border-t border-gray-200 shadow-inner"
      >
        <!-- 🔽  Add / replace with real poll component -->
        <slot>
          <p class="text-sm">📊 Polls list placeholder…</p>
        </slot>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* slide-down / slide-up + fade */
.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 500px; /* large enough to fit content */
  opacity: 1;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

/* remove top-right-left radius so card + dropdown look like one block */
.dropdown-content {
  border-bottom-left-radius: 0.5rem; /* match card radius */
  border-bottom-right-radius: 0.5rem;
}
</style>
