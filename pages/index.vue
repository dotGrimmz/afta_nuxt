<template>
  <div>
    <section class="relative w-full h-[30vh]">
      <Hyperspeed />
      <div
        class="top-0 left-0 z-1 absolute flex flex-col justify-center items-center w-full h-full pointer-events-none bg-clip-text text-transparent"
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
      </div>
    </section>

    <div class="flex flex-col gap-4 bg-black p-4 min-h-screen">
      <PollsPollSection />
      <BossSection />
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

.pc-card {
  height: 100px;
  width: 100px;
}
</style>

<script setup>
import Hyperspeed from "~/components/vue-bits/Hyperspeed.vue";
import BossSection from "~/components/bosses/BossSection.vue";
import EventsSection from "~/components/events/EventsSection.vue";
import ProfileCard from "~/components/vue-bits/Components/ProfileCard/ProfileCard.vue";
</script>
