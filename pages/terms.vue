<template>
  <ClientOnly>
    <div
      class="relative min-h-screen w-full overflow-hidden bg-black text-white"
    >
      <header
        class="fixed left-0 right-0 top-0 z-30 flex items-center justify-end px-8 py-4 text-sm uppercase tracking-wide"
      >
        <NuxtLink
          to="/"
          class="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold transition-colors hover:border-emerald-400 hover:bg-emerald-400/20"
        >
          Back Home
        </NuxtLink>
      </header>

      <div class="absolute inset-0 -z-10">
        <LightRays
          rays-color="#05DF72"
          :rays-speed="0.45"
          :light-spread="1.2"
          :ray-length="2.8"
          :fade-distance="1.4"
          :noise-amount="0.08"
          :distortion="0.12"
          class-name="opacity-70"
        />
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_top,#0b2f2c55,transparent_55%)]"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
      </div>

      <main class="relative z-10 mx-auto flex max-w-4xl flex-col px-6 pb-20 pt-28">
        <div class="text-center">
          <p class="text-xs uppercase tracking-[0.6em] text-emerald-300/70">
            Our Terms
          </p>
          <h1 class="mt-3 text-4xl font-semibold md:text-5xl">
            Terms of Service
          </h1>
          <p class="mt-4 text-sm text-white/60">
            Effective Date: September 2025
          </p>
        </div>

        <article
          class="mt-12 space-y-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_rgba(12,200,155,0.15)] backdrop-blur-3xl md:p-12"
        >
          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-emerald-200">
              Welcome to AFTA
            </h2>
            <p class="text-sm leading-relaxed text-white/70">
              By accessing AFTA you agree to these Terms of Service. We built
              this platform to keep the community engaged, so the rules below
              help keep things fair, safe, and fun for everyone. Terms may
              evolve as we ship new features during beta.
            </p>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-emerald-200">
              User Responsibilities
            </h2>
            <p class="text-sm leading-relaxed text-white/70">
              Every member of the desk plays a part in keeping the vibe right.
              We expect all players to act responsibly:
            </p>
            <ul class="space-y-2 text-sm text-white/70">
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Use the app respectfully and within the law.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Do not attempt to hack, reverse engineer, or disrupt AFTA’s
                  services.
                </span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  Understand that features may shift quickly while we iterate in
                  beta.
                </span>
              </li>
            </ul>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-emerald-200">
              Account Suspension
            </h2>
            <p class="text-sm leading-relaxed text-white/70">
              We reserve the right to suspend or terminate accounts if activity
              puts the community or infrastructure at risk, including abuse,
              spam, or violating these terms. When possible, we will notify
              impacted users with details and next steps.
            </p>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-emerald-200">
              Service Availability
            </h2>
            <p class="text-sm leading-relaxed text-white/70">
              We aim for smooth draws and clean dashboards, but downtime can
              happen during rapid releases. AFTA may pause service for
              maintenance or updates. Critical outages will be communicated
              through community channels as fast as possible.
            </p>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-emerald-200">Contact</h2>
            <p class="text-sm leading-relaxed text-white/70">
              Questions about these terms or need clarity on how we operate?
              Reach out any time and we’ll walk you through it.
            </p>
            <a
              href="mailto:dotgrimmz@gmail.com"
              class="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-100"
            >
              dotgrimmz@gmail.com
              <span aria-hidden="true">→</span>
            </a>
          </section>
        </article>
      </main>
    </div>

    <template #fallback>
      <div class="min-h-screen bg-black" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import LightRays from "~/components/vue-bits/Backgrounds/LightRays/LightRays.vue";
</script>
