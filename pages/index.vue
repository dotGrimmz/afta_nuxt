<template>
  <div>
    <section class="relative w-full h-[40vh]">
      <Hyperspeed />
      <div
        class="top-0 left-0 z-1 absolute flex flex-col justify-center gap-2 items-center w-full h-full pointer-events-none bg-clip-text text-transparent"
      >
        <ProfileCard
          name="🅶𝕣ⅈ𝕞𝕞𝕫"
          title="That fuckin DUDE"
          handle="javicodes"
          status="Online"
          contact-text="Contact Me"
          avatar-url="/images/black_sweater.jpg"
          :show-user-info="false"
          :show-behind-gradient="true"
          :enable-tilt="true"
          @contact-click="handleContactClick"
        />
        <div
          :style="{
            height: '10vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginTop: '1rem',
          }"
        >
          <div
            v-for="(boss, index) in allTime"
            :key="index"
            class="flex flex-col items-center gap-1"
          >
            <UAvatar
              class="size-[72px] text-[36px]"
              :src="boss.avatarUrl"
              :class="boss.class"
              :img-class="boss.imagePosition"
            />
            <span class="text-xs text-white font-medium text-center">
              <UBadge
                :class="boss.nameStyles"
                color="secondary"
                variant="subtle"
                size="sm"
                class="font-bold rounded-full"
                >{{ boss.name }}</UBadge
              >
            </span>
          </div>
        </div>
      </div>
    </section>

    <div class="flex flex-col gap-4 bg-black p-4 min-h-screen">
      <BossSection />

      <PollsPollSection />
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
import ProfileCard from "~/components/vue-bits/Components/ProfileCard/ProfileCard.vue";

const allTime = [
  {
    avatarUrl: "/images/overall/leigh_twin.jpg",
    class: "mt-6",
    imagePosition: "object-[center_70%]",
    name: "♏️ᴹᶻ🅃ȏ̈χɪᴄ♠️🄻𝖊i𝖌H",
  },
  {
    avatarUrl: "/images/overall/extra_white.jpg",
    class: "mb-6",
    imagePosition: "",
    name: "♓🅹𝖚𝖘♠️𝕏𝖙𝖗𝖆 🅷𝖔𝖙🔥",
  },
  {
    avatarUrl: "/images/overall/slim_thick_goodie.jpg",
    class: "mt-6",
    name: "♌️MORRAH🔞",
  },
];
</script>
