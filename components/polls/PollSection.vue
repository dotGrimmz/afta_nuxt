<script setup lang="ts">
import { ref } from "vue";
import ActivePoll from "~/components/polls/ActivePoll.vue";
import { usePollAdmin } from "~/composables/usePollAdmin";
import AnimatedList from "~/components/vue-bits/AnimatedList.vue";
import { useResponsiveImage } from "#imports";

/* ▸ open / closed state for dropdown */
const open = ref(false);

const { activePolls, refreshPolls } = usePollAdmin();
import ScrollVelocity from "../vue-bits/TextAnimations/ScrollVelocity/ScrollVelocity.vue";
</script>
<template>
  <!-- Wrapper keeps card + dropdown grouped -->
  <UCollapsible v-model:open="open">
    <!-- Main card -->

    <SectionCard
      objectFit="cover"
      objectPosition="bottom center"
      class="h-[190px] bg-black"
    >
      <ScrollVelocity
        :texts="['Polls ♠️ Polls ✦', 'Polls ♠️ Polls ✦']"
        :velocity="20"
        :damping="50"
        :stiffness="400"
        :velocity-mapping="{ input: [0, 1000], output: [0, 5] }"
        class-name=" text-black"
        parallax-class-name="h-full"
        scroller-class-name=""
      />
    </SectionCard>
    <template #content>
      <AnimatedList
        :displayScrollbar="false"
        className="w-[200px]"
        :items="activePolls"
      >
        <template #default="{ item: poll }">
          <ActivePoll :poll="poll" :refresh="refreshPolls" />
        </template>
      </AnimatedList>
    </template>
  </UCollapsible>
</template>

<style scoped>
.custom-scroll-text {
  color: black;
}

.custom-parallax {
  background-color: black;
}

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

/* remove top-right-left radius so card + dropdown look unified */
.dropdown-content {
  border-bottom-left-radius: 0.5rem; /* match card radius */
  border-bottom-right-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
}

.active-poll-wrapper {
  display: flex;
  align-items: center;
  justify-self: center;
  width: 100%;
  padding: 0.5rem;
}
</style>
