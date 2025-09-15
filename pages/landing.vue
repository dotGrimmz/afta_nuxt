<template>
  <div class="relative w-full min-h-screen overflow-x-hidden">
    <!-- ✅ Background -->
    <div class="absolute inset-0 -z-10">
      <Plasma
        color="#95f4a5"
        :speed="2"
        direction="reverse"
        :scale="1.7"
        :opacity="1"
        :mouseInteractive="false"
      />
    </div>

    <!-- ✅ Sticky Header -->
    <Header />

    <!-- ✅ Content Sections -->
    <main :style="{ paddingTop: '64px' }">
      <LandingSection>
        <BlurText
          text="Welcome to Afta"
          :delay="300"
          class-name="text-4xl font-semibold text-center"
          animate-by="words"
          direction="top"
          :threshold="0.1"
          root-margin="0px"
          :step-duration="0.35"
        />
      </LandingSection>
      <LandingSection>
        <p class="text-xl text-white">How it works section…</p>
      </LandingSection>
      <LandingSection>
        <p class="text-xl text-white">How it make section…</p>
      </LandingSection>
      <LandingSection>
        <p class="text-xl text-white">How it jumk section…</p>
      </LandingSection>
      <LandingSection>
        <p class="text-xl text-white">How it mya section…</p>
      </LandingSection>
      <LandingSection>
        <p class="text-xl text-white">How it Jim section…</p>
      </LandingSection>
      <LandingSection>
        <p class="text-xl text-white">How it Wooooo section…</p>
      </LandingSection>
    </main>

    <!-- ✅ Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Plasma from "~/components/vue-bits/Backgrounds/Plasma/Plasma.vue";
import Header from "~/components/landing/Header.vue";
import LandingSection from "~/components/landing/LandingSection.vue";
import Footer from "~/components/landing/Footer.vue";
import BlurText from "~/components/vue-bits/TextAnimations/BlurText/BlurText.vue";
</script>
