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
          class="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold transition-colors hover:border-sky-400 hover:bg-sky-400/20"
        >
          Back Home
        </NuxtLink>
      </header>

      <div class="absolute inset-0 -z-10">
        <div class="absolute inset-0 opacity-70">
          <Orb :hue="200" :hover-intensity="0.3" :rotate-on-hover="false" />
        </div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,#10213b80,transparent_60%)]" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black" />
      </div>

      <main class="relative z-10 mx-auto flex max-w-4xl flex-col px-6 pb-20 pt-28">
        <div class="text-center">
          <p class="text-xs uppercase tracking-[0.6em] text-sky-300/70">
            Your Privacy
          </p>
          <h1 class="mt-3 text-4xl font-semibold md:text-5xl">Privacy Policy</h1>
          <p class="mt-4 text-sm text-white/60">
            Effective Date: September 2025
          </p>
        </div>

        <article
          class="mt-12 space-y-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_rgba(59,130,246,0.18)] backdrop-blur-3xl md:p-12"
        >
          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-sky-200">
              How We Protect You
            </h2>
            <p class="text-sm leading-relaxed text-white/70">
              AFTA collects only what we need to sign you in, personalize games,
              and keep your experience secure. We treat every user like a member
              of the core squad—your information stays guarded and
              purpose-driven.
            </p>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-sky-200">
              Information We Collect
            </h2>
            <p class="text-sm leading-relaxed text-white/70">
              We keep data collection lean. Typical details include:
            </p>
            <ul class="space-y-2 text-sm text-white/70">
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>Email address provided through Google sign-in.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>Display name, avatar, and other basic profile metadata.</span>
              </li>
            </ul>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-sky-200">
              How We Use Your Information
            </h2>
            <p class="text-sm leading-relaxed text-white/70">
              Every data point has a job. We rely on the above details to:
            </p>
            <ul class="space-y-2 text-sm text-white/70">
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>Authenticate you quickly and securely.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>Personalize lobbies, events, and payouts.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>Protect your account from fraud or unauthorized access.</span>
              </li>
            </ul>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-sky-200">Data Sharing</h2>
            <p class="text-sm leading-relaxed text-white/70">
              We never sell your information. Player data lives inside Supabase
              with access restricted to essential staff. We only share
              information if law requires it or to resolve security issues.
            </p>
          </section>

          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-sky-200">Contact</h2>
            <p class="text-sm leading-relaxed text-white/70">
              Need insight into how your data is handled, or want something
              removed? Let us know and we will respond quickly.
            </p>
            <a
              href="mailto:rakeemxng@gmail.com"
              class="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition-colors hover:text-sky-100"
            >
              rakeemxng@gmail.com
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
import Orb from "~/components/vue-bits/Backgrounds/Orb/Orb.vue";
</script>
