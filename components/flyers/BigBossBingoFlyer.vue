<template>
  <div
    class="relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_45px_120px_rgba(0,0,0,0.55)] aspect-square"
  >
    <NuxtImg
      src="/images/flyers/bingo.png"
      alt="Big Boss Bingo flyer"
      class="absolute inset-0 h-full w-full object-cover"
      sizes="(max-width: 768px) 100vw, 768px"
    />

    <div
      class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
    />

    <div class="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
      <div class="flex max-w-lg flex-col gap-6 text-left md:max-w-xl">
        <div
          class="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-1 text-[11px] uppercase tracking-[0.4em] text-emerald-200"
        >
          Elite Event
        </div>

        <div class="flex flex-col gap-4">
          <h1
            class="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
          >
            Big Boss Bingo
          </h1>
          <div class="flex flex-wrap items-start gap-4 md:items-center">
            <div class="flex flex-col items-center gap-3 text-center">
              <div class="relative">
                <NuxtImg
                  src="/images/logo/dragon.png"
                  alt="Dragon prize icon"
                  class="h-20 w-20 translate-y-3 rounded-full border border-emerald-200/50 bg-emerald-300/10 p-3 shadow-[0_18px_45px_rgba(16,185,129,0.45)] backdrop-blur"
                  sizes="80px"
                />
                <span
                  class="absolute left-1/3 top-1.2 w-max -translate-x-1/3 -translate-y-1/5 rounded-full bg-emerald-400 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-black shadow-[0_12px_30px_rgba(16,185,129,0.45)]"
                >
                  Win a dragon
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 text-white/80 sm:gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            <span
              class="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-100/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200 sm:text-xs"
            >
              50k gold a card · Up to 5 cards
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            <span
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 sm:text-xs"
            >
              Saturday · October 4 · 7PM EST
            </span>
          </div>
        </div>

        <div
          class="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/50 sm:text-xs"
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
