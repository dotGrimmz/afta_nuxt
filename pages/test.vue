<template>
  <div
    class="min-h-screen bg-gradient-to-br from-black via-[#050b16] to-[#0f1f29] text-white flex items-center justify-center px-6 py-16"
  >
    <div
      class="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 shadow-[0_45px_120px_rgba(0,0,0,0.55)]"
    >
      <NuxtImg
        src="/images/flyers/bingo.png"
        alt="Big Boss Bingo flyer"
        class="h-[640px] w-full object-cover"
        sizes="(max-width: 768px) 100vw, 768px"
      />

      <div
        class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
      />

      <div class="absolute bottom-0 left-0 right-0 p-10">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-emerald-200"
        >
          Elite Event
        </div>

        <h1 class="mt-6 text-5xl font-semibold leading-none tracking-tight">
          Big Boss Bingo
        </h1>
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <div class="relative inline-flex items-center justify-center">
            <NuxtImg
              src="/images/logo/dragon.png"
              alt="Dragon prize icon"
              class="h-20 w-20 rounded-full border border-emerald-200/50 bg-emerald-300/10 p-3 shadow-[0_18px_45px_rgba(16,185,129,0.45)] backdrop-blur"
              sizes="80px"
            />
            <span
              class="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black shadow-[0_12px_30px_rgba(16,185,129,0.45)]"
            >
              Win a dragon
            </span>
          </div>
        </div>

        <div
          class="mt-6 grid gap-3 text-sm text-white/80 md:grid-cols-[auto_auto] md:items-center"
        >
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            <span
              class="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200"
            >
              50k gold a card · Up to 5 cards
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            <span
              class="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80"
            >
              Saturday · October 4 · 7PM EST
            </span>
          </div>
        </div>

        <div
          class="mt-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50"
        >
          <span class="flex items-center gap-2">
            <span class="h-1.5 w-10 rounded-full bg-emerald-400/60" />
            Reserve your spot now
          </span>
          <span>vip • limited seats • high stakes</span>
        </div>
      </div>
    </div>
  </div>
</template>
